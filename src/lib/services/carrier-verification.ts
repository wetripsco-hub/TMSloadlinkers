import type {
  CarrierVerificationProvider,
  CarrierVerificationResult,
} from "../../../types/domain";

export type SafetyRating = "Satisfactory" | "Conditional" | "Unsatisfactory" | "None";

const FMCSA_BASE_URL = "https://mobile.fmcsa.dot.gov/qc/services/carriers";

interface FmcsaCarrierResponse {
  content?: {
    carrier?: {
      allowedToOperate?: string;
      safetyRating?: string;
      oosDate?: string | null;
      bipdInsuranceOnFile?: string;
    };
  };
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

// Queries the public FMCSA QCMobile API (SAFER snapshot data). Used only when
// an FMCSA_WEB_KEY is configured; see createCarrierVerificationProvider.
export class FmcsaCarrierVerificationProvider implements CarrierVerificationProvider {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  async verify(input: { dotNumber?: string; mcNumber?: string }): Promise<CarrierVerificationResult> {
    const identifier = input.dotNumber ?? input.mcNumber;
    if (!identifier) {
      throw new Error("verify requires a dotNumber or mcNumber");
    }

    const url = `${FMCSA_BASE_URL}/${encodeURIComponent(identifier)}?webKey=${encodeURIComponent(this.apiKey)}`;
    const response = await this.fetchImpl(url);

    if (!response.ok) {
      throw new Error(`FMCSA lookup failed with status ${response.status}`);
    }

    const payload = (await response.json()) as FmcsaCarrierResponse;
    const carrier = payload.content?.carrier;

    return {
      authorityActive: carrier?.allowedToOperate === "Y",
      safetyRating: normalizeSafetyRating(carrier?.safetyRating),
      insuranceOnFile: carrier?.bipdInsuranceOnFile === "Y",
      outOfServiceDate: carrier?.oosDate ?? null,
      source: "fmcsa",
      fetchedAt: new Date().toISOString(),
      raw: payload,
    };
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

    return {
      authorityActive: bucket !== 3,
      safetyRating,
      insuranceOnFile: bucket !== 2,
      outOfServiceDate: bucket === 2 ? new Date().toISOString().slice(0, 10) : null,
      source: "mock",
      fetchedAt: new Date().toISOString(),
      raw: { identifier, bucket, mock: true },
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
