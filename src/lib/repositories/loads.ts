import { createClient } from "@/lib/supabase/server";
import { parseCents, formatCents } from "@/lib/money";
import type { Cents, Load, LoadStatus, LoadStop, UUID } from "../../../types/domain";

// The `loads` table does not yet persist every field on the Load domain
// interface (equipmentType, dispatcherCommissionEarned, structured stop
// details, etc). Those fields are filled with safe defaults below until the
// schema catches up. Tracking/driver/GPS fields are real columns as of
// migrations/009_tracking.sql; load_number is a real column as of
// migrations/037_tracking_checkin.sql.

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
  created_at: string;
  updated_at: string;
}

const LOAD_COLUMNS =
  "id, org_id, customer_id, carrier_id, status, load_number, origin, destination, pickup_date, delivery_date, shipper_rate, carrier_pay, broker_margin, equipment_type, commodity, weight_lbs, customer_po_number, tracking_token, driver_name, driver_phone, truck_number, trailer_number, last_known_lat, last_known_lng, last_ping_at, created_at, updated_at";

function moneyToCents(value: number): Cents {
  return parseCents(String(value));
}

function centsToMoney(cents: Cents): string {
  return formatCents(cents).replace(/[$,]/g, "");
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

function mapRowToLoad(row: LoadRow): Load {
  return {
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

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListLoadsFilters {
  status?: LoadStatus;
  customerId?: UUID;
  carrierId?: UUID;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface ListLoadsResult {
  data: Load[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateLoadInput {
  customerId?: UUID | null;
  carrierId?: UUID | null;
  origin?: string | null;
  destination?: string | null;
  pickupDate?: string | null;
  deliveryDate?: string | null;
  shipperRate: Cents;
  carrierPay: Cents;
  equipmentType?: string | null;
  commodity?: string | null;
  weightLbs?: number | null;
  needsShipperRate?: boolean;
  customerPoNumber?: string | null;
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

export async function listLoads(
  filters: ListLoadsFilters,
  pagination: Pagination
): Promise<ListLoadsResult> {
  const supabase = await createClient();
  const { page, pageSize } = pagination;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("loads")
    .select(LOAD_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }
  if (filters.carrierId) {
    query = query.eq("carrier_id", filters.carrierId);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    data: (data as unknown as LoadRow[]).map(mapRowToLoad),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getLoadById(id: UUID): Promise<Load | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("loads")
    .select(LOAD_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  return mapRowToLoad(data as unknown as LoadRow);
}

export async function createLoad(input: CreateLoadInput): Promise<Load> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);

  const { data, error } = await supabase
    .from("loads")
    .insert({
      org_id: orgId,
      customer_id: input.customerId ?? null,
      carrier_id: input.carrierId ?? null,
      origin: input.origin ?? null,
      destination: input.destination ?? null,
      pickup_date: input.pickupDate ?? null,
      delivery_date: input.deliveryDate ?? null,
      shipper_rate: Number(centsToMoney(input.shipperRate)),
      carrier_pay: Number(centsToMoney(input.carrierPay)),
      equipment_type: input.equipmentType ?? null,
      commodity: input.commodity ?? null,
      weight_lbs: input.weightLbs ?? null,
      customer_po_number: input.customerPoNumber ?? null,
      // Left undefined (and therefore omitted from the insert payload) when
      // the caller doesn't pass it, so the column's own default (false)
      // applies -- the load wizard's existing call site is unaffected.
      needs_shipper_rate: input.needsShipperRate,
    })
    .select(LOAD_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToLoad(data as unknown as LoadRow);
}

// Additive: for bulk POD auto-matching. Compares trimmed + case-insensitive
// (PO numbers commonly arrive with inconsistent casing/whitespace across
// documents) -- deliberately not fuzzy, so a near-miss never silently
// links a document to the wrong load. If more than one load shares a PO#,
// the most recently created one is returned rather than erroring.
export async function findLoadByCustomerPoNumber(poNumber: string): Promise<Load | null> {
  const trimmed = poNumber.trim();
  if (!trimmed) {
    return null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("loads")
    .select(LOAD_COLUMNS)
    .ilike("customer_po_number", trimmed)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }
  if (!data || data.length === 0) {
    return null;
  }

  return mapRowToLoad(data[0] as unknown as LoadRow);
}

export async function updateLoadStatus(id: UUID, nextStatus: LoadStatus): Promise<Load> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("loads")
    .update({ status: nextStatus })
    .eq("id", id)
    .select(LOAD_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToLoad(data as unknown as LoadRow);
}

export async function assignCarrier(loadId: UUID, carrierId: UUID): Promise<Load> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("loads")
    .update({ carrier_id: carrierId })
    .eq("id", loadId)
    .select(LOAD_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToLoad(data as unknown as LoadRow);
}

export interface DriverInfoInput {
  driverName: string | null;
  driverPhone: string | null;
  truckNumber: string | null;
  trailerNumber: string | null;
}

// Focused update: touches only these four columns, unlike a general-purpose
// load update, so a dispatcher editing driver/truck details can never
// accidentally clobber rate, status, or stop fields with stale form state.
export async function updateDriverInfo(loadId: UUID, fields: DriverInfoInput): Promise<Load> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("loads")
    .update({
      driver_name: fields.driverName,
      driver_phone: fields.driverPhone,
      truck_number: fields.truckNumber,
      trailer_number: fields.trailerNumber,
    })
    .eq("id", loadId)
    .select(LOAD_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToLoad(data as unknown as LoadRow);
}

// Additive: fills in the shipper_rate a load created from a RateCon
// extraction was missing (see createLoadFromDocument), clearing the
// needs_shipper_rate flag in the same update.
export async function completeShipperRate(loadId: UUID, shipperRateCents: Cents): Promise<Load> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("loads")
    .update({
      shipper_rate: Number(centsToMoney(shipperRateCents)),
      needs_shipper_rate: false,
    })
    .eq("id", loadId)
    .select(LOAD_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToLoad(data as unknown as LoadRow);
}
