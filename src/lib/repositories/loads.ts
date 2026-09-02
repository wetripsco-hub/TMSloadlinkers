import { createClient } from "@/lib/supabase/server";
import { parseCents, formatCents } from "@/lib/money";
import type { Cents, Load, LoadStatus, LoadStop, UUID } from "../../../types/domain";

// The `loads` table does not yet persist every field on the Load domain
// interface (loadNumber, equipmentType, trackingToken, driver/GPS fields,
// dispatcherCommissionEarned, structured stop details, etc). Those fields
// are filled with safe defaults below until the schema catches up.

interface LoadRow {
  id: string;
  org_id: string;
  customer_id: string | null;
  carrier_id: string | null;
  status: LoadStatus;
  origin: string | null;
  destination: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  shipper_rate: number;
  carrier_pay: number;
  broker_margin: number;
  created_at: string;
  updated_at: string;
}

const LOAD_COLUMNS =
  "id, org_id, customer_id, carrier_id, status, origin, destination, pickup_date, delivery_date, shipper_rate, carrier_pay, broker_margin, created_at, updated_at";

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
    loadNumber: "",
    status: row.status,
    customerId: row.customer_id,
    carrierId: row.carrier_id,
    createdByUserId: null,

    shipperRate: moneyToCents(row.shipper_rate),
    carrierPay: moneyToCents(row.carrier_pay),
    brokerMargin: moneyToCents(row.broker_margin),
    dispatcherCommissionEarned: 0,

    equipmentType: "",
    weightLbs: null,
    commodity: null,
    temperatureSetting: null,
    specialInstructions: null,

    origin: toStop(row.origin, row.pickup_date),
    destination: toStop(row.destination, row.delivery_date),

    trackingToken: "",
    driverName: null,
    driverPhone: null,
    truckNumber: null,
    trailerNumber: null,
    lastKnownLat: null,
    lastKnownLng: null,
    lastPingAt: null,

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

  if (error || !data) {
    throw new Error("No profile found for the current user");
  }

  return data.org_id;
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
      shipper_rate: centsToMoney(input.shipperRate),
      carrier_pay: centsToMoney(input.carrierPay),
    })
    .select(LOAD_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToLoad(data as unknown as LoadRow);
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
