import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { parseCents } from "@/lib/money";
import type { Cents, Load, LoadStatus, LoadStop } from "../../../types/domain";
import type { CarrierRecord } from "@/lib/repositories/carriers";

interface LoadRow {
  id: string;
  org_id: string;
  customer_id: string | null;
  carrier_id: string | null;
  status: LoadStatus;
  load_number: string | null;
  origin: string | null;
  destination: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  shipper_rate: number;
  carrier_pay: number;
  broker_margin: number;
  equipment_type: string | null;
  commodity: string | null;
  weight_lbs: number | null;
  customer_po_number: string | null;
  tracking_token: string;
  driver_name: string | null;
  driver_phone: string | null;
  truck_number: string | null;
  trailer_number: string | null;
  last_known_lat: number | null;
  last_known_lng: number | null;
  last_ping_at: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
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

// Read-only, platform-admin preview surface. Every function here takes an
// explicit org_id and uses the service-role client (bypassing RLS) because
// a platform admin has no org_id of their own -- the tenant-scoped
// repositories (repositories/loads.ts, repositories/carriers.ts) resolve
// org_id from the caller's own profile and cannot be reused for this.
// No write functions belong in this file: mutation from a preview session
// is out of scope by design (see startOrgPreview/endOrgPreview in
// app/actions/platform-admin.ts, which are the only writes a preview
// session may perform).

export interface PreviewOrganization {
  id: string;
  name: string;
  workspaceType: string;
  accountStatus: string;
  suspendedReason: string | null;
}

export async function getPreviewOrganization(
  orgId: string
): Promise<PreviewOrganization | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, workspace_type, account_status, suspended_reason")
    .eq("id", orgId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    workspaceType: data.workspace_type,
    accountStatus: data.account_status,
    suspendedReason: data.suspended_reason,
  };
}

function moneyToCents(value: number): Cents {
  return parseCents(String(value));
}

function toStop(rawAddress: string | null, windowStart: string | null): LoadStop {
  return {
    facilityName: null,
    address: rawAddress,
    city: "",
    state: "",
    zip: "",
    windowStart: windowStart ?? "",
    windowEnd: null,
  };
}

const LOAD_COLUMNS =
  "id, org_id, customer_id, carrier_id, status, load_number, origin, destination, pickup_date, delivery_date, shipper_rate, carrier_pay, broker_margin, equipment_type, commodity, weight_lbs, customer_po_number, tracking_token, driver_name, driver_phone, truck_number, trailer_number, last_known_lat, last_known_lng, last_ping_at, is_demo, created_at, updated_at";

export async function getPreviewLoads(orgId: string): Promise<Load[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("loads")
    .select(LOAD_COLUMNS)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  return (data as unknown as LoadRow[]).map((row) => ({
    id: row.id,
    orgId: row.org_id,
    loadNumber: row.load_number ?? "",
    status: row.status,
    customerId: row.customer_id,
    carrierId: row.carrier_id,
    createdByUserId: null,

    shipperRate: moneyToCents(row.shipper_rate),
    carrierPay: moneyToCents(row.carrier_pay),
    brokerMargin: moneyToCents(row.broker_margin),
    dispatcherCommissionEarned: 0,

    equipmentType: row.equipment_type ?? "",
    weightLbs: row.weight_lbs,
    commodity: row.commodity,
    temperatureSetting: null,
    specialInstructions: null,
    customerPoNumber: row.customer_po_number,

    origin: toStop(row.origin, row.pickup_date),
    destination: toStop(row.destination, row.delivery_date),

    trackingToken: row.tracking_token,
    driverName: row.driver_name,
    driverPhone: row.driver_phone,
    truckNumber: row.truck_number,
    trailerNumber: row.trailer_number,
    lastKnownLat: row.last_known_lat,
    lastKnownLng: row.last_known_lng,
    lastPingAt: row.last_ping_at,

    isDemo: row.is_demo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

function carrierMoneyToCents(value: number | null): Cents {
  return parseCents(String(value ?? 0));
}

const CARRIER_COLUMNS =
  "id, org_id, name, mc_number, dot_number, contact_email, contact_phone, authority_status, safety_rating, out_of_service_date, last_verified_at, verification_source, insurance_carrier_name, insurance_policy_number, insurance_expiry_date, cargo_coverage_limit, auto_liability_limit, is_blacklisted, blacklist_reason, coi_file_url, created_at";

export async function getPreviewCarriers(orgId: string): Promise<CarrierRecord[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("carriers")
    .select(CARRIER_COLUMNS)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  return (data as unknown as CarrierRow[]).map((row) => ({
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
    cargoCoverageLimit: carrierMoneyToCents(row.cargo_coverage_limit),
    autoLiabilityLimit: carrierMoneyToCents(row.auto_liability_limit),
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
  }));
}
