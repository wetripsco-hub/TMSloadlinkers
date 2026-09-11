import type {
  CarrierVerificationProvider,
  CarrierVerificationResult,
} from "../../../types/domain";
import type { Json } from "../../../types/database";

export type SafetyRating = "Satisfactory" | "Conditional" | "Unsatisfactory" | "None";

const FMCSA_BASE_URL = "https://mobile.fmcsa.dot.gov/qc/services/carriers";

interface FmcsaCarrierResponse {
  content?: {
    carrier?: {
      allowedToOperate?: string;
      safetyRating?: string;
      oosDate?: string | null;
      bipdInsuranceOnFile?: string;
      legalName?: string;
      dbaName?: string;
      phyStreet?: string;
      phyCity?: string;
      phyState?: string;
      phyZipcode?: string;
      phyCountry?: string;
    };
  };
}

type FmcsaCarrier = NonNullable<NonNullable<FmcsaCarrierResponse["content"]>["carrier"]>;

// Builds a single-line address from the QCMobile carrier snapshot's phy*
// fields. Missing pieces are simply omitted rather than left as blank commas.
function buildPhysicalAddress(carrier: FmcsaCarrier | undefined): string | null {
  if (!carrier) return null;
  const cityStateZip = [carrier.phyCity, carrier.phyState].filter(Boolean).join(", ");
  const line2 = [cityStateZip, carrier.phyZipcode].filter(Boolean).join(" ");
  const parts = [carrier.phyStreet, line2, carrier.phyCountry].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function normalizeSafetyRating(raw: string | null | undefined): SafetyRating {
  switch ((raw ?? "").trim().toUpperCase()) {
    case "S":
    case "SATISFACTORY":
      return "Satisfactory";
    case "C":
    case "CONDITIONAL":
      return "Conditional";
    case "U":
    case "UNSATISFACTORY":
      return "Unsatisfactory";
    default:
      return "None";
  }
}

function mapFmcsaResponseToResult(
  payload: FmcsaCarrierResponse,
  fetchedAt: string = new Date().toISOString()
): CarrierVerificationResult {
  const carrier = payload.content?.carrier;

  return {
    authorityActive: carrier?.allowedToOperate === "Y",
    safetyRating: normalizeSafetyRating(carrier?.safetyRating),
    insuranceOnFile: carrier?.bipdInsuranceOnFile === "Y",
    outOfServiceDate: carrier?.oosDate ?? null,
    source: "fmcsa",
    fetchedAt,
    raw: payload,
    companyName: carrier?.legalName ?? carrier?.dbaName ?? null,
    physicalAddress: buildPhysicalAddress(carrier),
  };
}

// Injectable so FmcsaCarrierVerificationProvider stays unit-testable with a
// plain fetch mock, the same way it already is today, without needing a
// real Supabase project for tests that don't care about caching -- mirrors
// how `fetchImpl` is already injected below.
export interface FmcsaLookupCacheStore {
  getFresh(
    input: { dotNumber?: string; mcNumber?: string }
  ): Promise<{ response: FmcsaCarrierResponse; fetchedAt: string } | null>;
  upsert(input: { dotNumber?: string; mcNumber?: string }, response: FmcsaCarrierResponse): Promise<void>;
}

const FMCSA_CACHE_TTL_DAYS = 7;

// MC/DOT numbers are purely numeric; trimming alone left whitespace-only
// differences ("4468959" vs " 4468959 ") as distinct cache keys (confirmed
// live: a dot_number was stored as "4468959 "), each causing its own
// duplicate FMCSA call. Stripping every non-digit character (not just
// leading/trailing whitespace) collapses those variants to one key.
export function normalizeCarrierIdentifier(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const digitsOnly = value.trim().replace(/\D/g, "");
  return digitsOnly.length > 0 ? digitsOnly : undefined;
}

function normalizeCacheKeyInput(input: {
  dotNumber?: string;
  mcNumber?: string;
}): { dotNumber?: string; mcNumber?: string } {
  return {
    dotNumber: normalizeCarrierIdentifier(input.dotNumber),
    mcNumber: normalizeCarrierIdentifier(input.mcNumber),
  };
}

// Real, service-role-backed cache store (supabase/migrations/041_fmcsa_lookup_cache.sql).
// `createServiceClient` is imported lazily (inside each method, not at
// module scope) because it pulls in the `server-only` package -- importing
// that eagerly here would make this whole module throw as soon as it's
// loaded outside Next's server runtime, which is exactly the environment
// this file's own unit tests run in (see lib/repositories/documents.ts for
// the same pattern already used elsewhere in this codebase).
const defaultFmcsaLookupCacheStore: FmcsaLookupCacheStore = {
  async getFresh(rawInput) {
    const input = normalizeCacheKeyInput(rawInput);
    const value = input.dotNumber ?? input.mcNumber;
    if (!value) return null;

    const { createServiceClient } = await import("@/lib/supabase/service");
    const supabase = createServiceClient();
    const column = input.dotNumber ? "dot_number" : "mc_number";

    const { data, error } = await supabase
      .from("fmcsa_lookup_cache")
      .select("response_json, fetched_at, expires_at")
      .eq(column, value)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error || !data) return null;

    return {
      response: data.response_json as unknown as FmcsaCarrierResponse,
      fetchedAt: data.fetched_at,
    };
  },

  async upsert(rawInput, response) {
    const input = normalizeCacheKeyInput(rawInput);
    const { createServiceClient } = await import("@/lib/supabase/service");
    const supabase = createServiceClient();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + FMCSA_CACHE_TTL_DAYS * 86400000);
    const conflictColumn = input.dotNumber ? "dot_number" : "mc_number";

    const { error } = await supabase.from("fmcsa_lookup_cache").upsert(
      {
        mc_number: input.mcNumber ?? null,
        dot_number: input.dotNumber ?? null,
        response_json: response as unknown as Json,
        fetched_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: conflictColumn }
    );

    if (error) {
      throw error;
    }
  },
};

// Queries the public FMCSA QCMobile API (SAFER snapshot data), caching
// responses in fmcsa_lookup_cache for 7 days so repeated onboarding
// auto-fill lookups for the same MC/DOT number don't re-hit FMCSA. Used
// only when an FMCSA_WEB_KEY is configured; see
// createCarrierVerificationProvider.
export class FmcsaCarrierVerificationProvider implements CarrierVerificationProvider {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly cacheStore: FmcsaLookupCacheStore = defaultFmcsaLookupCacheStore
  ) {}

  async verify(input: { dotNumber?: string; mcNumber?: string }): Promise<CarrierVerificationResult> {
    const identifier = input.dotNumber ?? input.mcNumber;
    if (!identifier) {
      throw new Error("verify requires a dotNumber or mcNumber");
    }

    // A cache-read failure (e.g. a transient DB hiccup) must never block a
    // lookup that would otherwise succeed against the real API -- treat it
    // as a miss and fall through to fetching fresh.
    let cached: { response: FmcsaCarrierResponse; fetchedAt: string } | null = null;
    try {
      cached = await this.cacheStore.getFresh(input);
    } catch (cacheReadErr) {
      console.error("FMCSA lookup cache read failed:", cacheReadErr);
    }

    if (cached) {
      return mapFmcsaResponseToResult(cached.response, cached.fetchedAt);
    }

    const url = `${FMCSA_BASE_URL}/${encodeURIComponent(identifier)}?webKey=${encodeURIComponent(this.apiKey)}`;
    const response = await this.fetchImpl(url);

    if (!response.ok) {
      throw new Error(`FMCSA lookup failed with status ${response.status}`);
    }

    const payload = (await response.json()) as FmcsaCarrierResponse;

    // Same reasoning as the cache read: a failed cache write must not turn
    // a successful FMCSA lookup into a failed one for the user.
    try {
      await this.cacheStore.upsert(input, payload);
    } catch (cacheWriteErr) {
      console.error("FMCSA lookup cache upsert failed:", cacheWriteErr);
    }

    return mapFmcsaResponseToResult(payload);
  }
}

// Deterministic offline stand-in for FmcsaCarrierVerificationProvider, used
// whenever no FMCSA_WEB_KEY is configured (local dev, CI, tests). The result
// is derived from the identifier's digits so repeated lookups of the same
// DOT/MC number are stable, without claiming a real authority check ran.
export class MockCarrierVerificationProvider implements CarrierVerificationProvider {
  async verify(input: { dotNumber?: string; mcNumber?: string }): Promise<CarrierVerificationResult> {
    const identifier = input.dotNumber ?? input.mcNumber;

    if (!identifier) {
      return {
        authorityActive: false,
        safetyRating: "None",
        insuranceOnFile: false,
        outOfServiceDate: null,
        source: "mock",
        fetchedAt: new Date().toISOString(),
        raw: { error: "no_identifier_supplied" },
      };
    }

    const digits = identifier.replace(/\D/g, "");
    const numeric = digits.length > 0 ? parseInt(digits, 10) : NaN;

    if (Number.isNaN(numeric)) {
      return {
        authorityActive: false,
        safetyRating: "None",
        insuranceOnFile: false,
        outOfServiceDate: null,
        source: "mock",
        fetchedAt: new Date().toISOString(),
        raw: { error: "unrecognized_identifier", identifier },
      };
    }

    const bucket = numeric % 4;
    const safetyRating: SafetyRating =
      bucket === 0
        ? "Satisfactory"
        : bucket === 1
          ? "Conditional"
          : bucket === 2
            ? "Unsatisfactory"
            : "None";

    const last4 = digits.slice(-4).padStart(4, "0");

    return {
      authorityActive: bucket !== 3,
      safetyRating,
      insuranceOnFile: bucket !== 2,
      outOfServiceDate: bucket === 2 ? new Date().toISOString().slice(0, 10) : null,
      source: "mock",
      fetchedAt: new Date().toISOString(),
      raw: { identifier, bucket, mock: true },
      companyName: `Mock Carrier ${last4} LLC`,
      physicalAddress: `${numeric % 9000 + 100} Mock Freight Way, Mockville, TX ${last4}`,
    };
  }
}

export function createCarrierVerificationProvider(
  apiKey: string | undefined = process.env.FMCSA_WEB_KEY
): CarrierVerificationProvider {
  if (apiKey) {
    return new FmcsaCarrierVerificationProvider(apiKey);
  }
  return new MockCarrierVerificationProvider();
}
