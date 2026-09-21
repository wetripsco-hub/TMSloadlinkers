import { createClient } from "@/lib/supabase/server";
import { parseCents, formatCents } from "@/lib/money";
import type { Carrier, Cents, UUID } from "../../../types/domain";

function moneyToCents(value: number | null): Cents {
  return parseCents(String(value ?? 0));
}

function centsToMoney(cents: Cents): string {
  return formatCents(cents).replace(/[$,]/g, "");
}

// The `carriers` table persists contact/identification fields, 5 FMCSA
// verification columns (047_carrier_verification_columns.sql), and 8
// manually-entered compliance columns (049_carrier_compliance_columns.sql:
// insurance_*, cargo/auto liability limits, is_blacklisted,
// blacklist_reason, coi_file_url). isInternalFleet/dispatchFee* from the
// full Carrier domain interface still have no backing column, so those
// stay inert fallbacks. contactEmail, contactPhone, outOfServiceDate,
// verificationSource, and coiFileUrl are real persisted columns with no
// slot on Carrier, so CarrierRecord extends it with them.
export interface CarrierRecord extends Carrier {
  contactEmail: string | null;
  contactPhone: string | null;
  outOfServiceDate: string | null;
  verificationSource: string | null;
  coiFileUrl: string | null;
}

interface CarrierRow {
  id: string;
  org_id: string;
  name: string;
  mc_number: string | null;
  dot_number: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  authority_status: string | null;
  safety_rating: string | null;
  out_of_service_date: string | null;
  last_verified_at: string | null;
  verification_source: string | null;
  insurance_carrier_name: string | null;
  insurance_policy_number: string | null;
  insurance_expiry_date: string | null;
  cargo_coverage_limit: number | null;
  auto_liability_limit: number | null;
  is_blacklisted: boolean;
  blacklist_reason: string | null;
  coi_file_url: string | null;
  created_at: string;
}

const CARRIER_COLUMNS =
  "id, org_id, name, mc_number, dot_number, contact_email, contact_phone, authority_status, safety_rating, out_of_service_date, last_verified_at, verification_source, insurance_carrier_name, insurance_policy_number, insurance_expiry_date, cargo_coverage_limit, auto_liability_limit, is_blacklisted, blacklist_reason, coi_file_url, created_at";

function mapRowToCarrier(row: CarrierRow): CarrierRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    companyName: row.name,
    dotNumber: row.dot_number ?? "",
    mcNumber: row.mc_number ?? "",
    safetyRating: row.safety_rating ?? "unrated",
    authorityStatus: row.authority_status ?? "unknown",
    insuranceCarrierName: row.insurance_carrier_name,
    insurancePolicyNumber: row.insurance_policy_number,
    insuranceExpiryDate: row.insurance_expiry_date,
    cargoCoverageLimit: moneyToCents(row.cargo_coverage_limit),
    autoLiabilityLimit: moneyToCents(row.auto_liability_limit),
    isBlacklisted: row.is_blacklisted,
    blacklistReason: row.blacklist_reason,
    isInternalFleet: false,
    dispatchFeePercentage: 0,
    dispatchFeeFlatWeekly: 0,
    lastVerifiedAt: row.last_verified_at,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    outOfServiceDate: row.out_of_service_date,
    verificationSource: row.verification_source,
    coiFileUrl: row.coi_file_url,
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

export interface CarrierComplianceFields {
  insuranceCarrierName: string | null;
  insurancePolicyNumber: string | null;
  insuranceExpiryDate: string | null;
  cargoCoverageLimit: Cents | null;
  autoLiabilityLimit: Cents | null;
  isBlacklisted: boolean;
  blacklistReason: string | null;
  coiFileUrl: string | null;
}

// Manually-entered compliance data (049_carrier_compliance_columns.sql),
// separate from updateCarrierVerification's FMCSA-derived columns above --
// this is never written by verifyCarrier/onboardCarrier. Session-bound
// client is correct here: carriers_update_own_org's RLS policy checks
// org_id (own-org, any role), not id = auth.uid() (own-row), so a plain
// update against a carrier already in the caller's org succeeds -- unlike
// the profiles RLS gap found earlier this session.
export async function updateCarrierCompliance(
  id: UUID,
  fields: CarrierComplianceFields
): Promise<CarrierRecord> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("carriers")
    .update({
      insurance_carrier_name: fields.insuranceCarrierName,
      insurance_policy_number: fields.insurancePolicyNumber,
      insurance_expiry_date: fields.insuranceExpiryDate,
      cargo_coverage_limit: fields.cargoCoverageLimit !== null ? Number(centsToMoney(fields.cargoCoverageLimit)) : null,
      auto_liability_limit: fields.autoLiabilityLimit !== null ? Number(centsToMoney(fields.autoLiabilityLimit)) : null,
      is_blacklisted: fields.isBlacklisted,
      blacklist_reason: fields.blacklistReason,
      coi_file_url: fields.coiFileUrl,
    })
    .eq("id", id)
    .select(CARRIER_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToCarrier(data as unknown as CarrierRow);
}

export interface CarrierVerificationFields {
  authorityStatus: string | null;
  safetyRating: string;
  outOfServiceDate: string | null;
  verificationSource: string;
  verifiedAt: string;
}

// Single write path for the 5 FMCSA verification columns
// (047_carrier_verification_columns.sql), used both at creation time
// (onboardCarrier, once previewCarrierVerification succeeds) and on
// re-verification (verifyCarrier / "Verify Safety"), so both call sites
// persist the exact same shape and last_verified_at always reflects the
// most recent check.
export async function updateCarrierVerification(
  id: UUID,
  fields: CarrierVerificationFields
): Promise<CarrierRecord> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("carriers")
    .update({
      authority_status: fields.authorityStatus,
      safety_rating: fields.safetyRating,
      out_of_service_date: fields.outOfServiceDate,
      verification_source: fields.verificationSource,
      last_verified_at: fields.verifiedAt,
    })
    .eq("id", id)
    .select(CARRIER_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToCarrier(data as unknown as CarrierRow);
}
