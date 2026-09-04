import { createClient } from "@/lib/supabase/server";
import type { Carrier, UUID } from "../../../types/domain";

// The `carriers` table only persists contact/identification fields today —
// compliance data (safety rating, insurance, blacklist status, dispatch fee)
// from the full Carrier domain interface has no backing column yet. Rows are
// mapped onto Carrier with safe, clearly-inert fallbacks (unrated/unknown/
// zero/false) rather than fabricating verified-looking data. contactEmail
// and contactPhone are real persisted columns with no slot on Carrier, so
// CarrierRecord extends it with them for callers that need contact info.
export interface CarrierRecord extends Carrier {
  contactEmail: string | null;
  contactPhone: string | null;
}

interface CarrierRow {
  id: string;
  org_id: string;
  name: string;
  mc_number: string | null;
  dot_number: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
}

const CARRIER_COLUMNS =
  "id, org_id, name, mc_number, dot_number, contact_email, contact_phone, created_at";

function mapRowToCarrier(row: CarrierRow): CarrierRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    companyName: row.name,
    dotNumber: row.dot_number ?? "",
    mcNumber: row.mc_number ?? "",
    safetyRating: "unrated",
    authorityStatus: "unknown",
    insuranceCarrierName: null,
    insurancePolicyNumber: null,
    insuranceExpiryDate: null,
    cargoCoverageLimit: 0,
    autoLiabilityLimit: 0,
    isBlacklisted: false,
    blacklistReason: null,
    isInternalFleet: false,
    dispatchFeePercentage: 0,
    dispatchFeeFlatWeekly: 0,
    lastVerifiedAt: null,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
  };
}

export interface ListCarriersFilters {
  name?: string;
  mcNumber?: string;
  dotNumber?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface ListCarriersResult {
  data: CarrierRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UpsertCarrierInput {
  id?: UUID;
  name: string;
  mcNumber?: string | null;
  dotNumber?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

// All queries below rely on Postgres RLS (policies scoped to
// `profiles.org_id` for the calling user) for tenant isolation. org_id is
// never accepted as a parameter; on writes it is resolved server-side from
// the caller's own profile so a caller cannot target another tenant.
async function getCurrentOrgId(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<UUID> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!error && data?.org_id) {
    return data.org_id;
  }

  const { ensureUserOrganization } = await import("@/lib/services/ensure-user-organization");
  const fallbackOrgId = await ensureUserOrganization(supabase);
  if (fallbackOrgId) {
    return fallbackOrgId;
  }

  throw new Error("No organization found for current user profile");
}

export async function listCarriers(
  filters: ListCarriersFilters,
  pagination: Pagination
): Promise<ListCarriersResult> {
  const supabase = await createClient();
  const { page, pageSize } = pagination;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("carriers")
    .select(CARRIER_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.name) {
    query = query.ilike("name", `%${filters.name}%`);
  }
  if (filters.mcNumber) {
    query = query.eq("mc_number", filters.mcNumber);
  }
  if (filters.dotNumber) {
    query = query.eq("dot_number", filters.dotNumber);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    data: (data as unknown as CarrierRow[]).map(mapRowToCarrier),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getCarrierById(id: UUID): Promise<CarrierRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("carriers")
    .select(CARRIER_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  return mapRowToCarrier(data as unknown as CarrierRow);
}

export async function upsertCarrier(input: UpsertCarrierInput): Promise<CarrierRecord> {
  const supabase = await createClient();

  const values = {
    name: input.name,
    mc_number: input.mcNumber ?? null,
    dot_number: input.dotNumber ?? null,
    contact_email: input.contactEmail ?? null,
    contact_phone: input.contactPhone ?? null,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("carriers")
      .update(values)
      .eq("id", input.id)
      .select(CARRIER_COLUMNS)
      .single();

    if (error) {
      throw error;
    }

    return mapRowToCarrier(data as unknown as CarrierRow);
  }

  const orgId = await getCurrentOrgId(supabase);

  const { data, error } = await supabase
    .from("carriers")
    .insert({ ...values, org_id: orgId })
    .select(CARRIER_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToCarrier(data as unknown as CarrierRow);
}
