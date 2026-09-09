import { createClient } from "@/lib/supabase/server";
import type { LoadStatus } from "../../../types/domain";

export interface TrackedLoadStop {
  facilityName: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  windowStart: string | null;
  windowEnd: string | null;
}

export interface TrackedLoad {
  id: string;
  status: LoadStatus;
  loadNumber: string | null;
  origin: string | null;
  destination: string | null;
  originStop: TrackedLoadStop;
  destinationStop: TrackedLoadStop;
  driverName: string | null;
  truckNumber: string | null;
  lastKnownLat: number | null;
  lastKnownLng: number | null;
  lastPingAt: string | null;
  arrivedAtPickupAt: string | null;
  departedPickupAt: string | null;
  arrivedAtDeliveryAt: string | null;
  deliveredAt: string | null;
}

interface TrackedLoadRow {
  id: string;
  status: LoadStatus;
  load_number: string | null;
  origin: string | null;
  destination: string | null;
  origin_facility_name: string | null;
  origin_city: string | null;
  origin_state: string | null;
  origin_zip: string | null;
  pickup_date: string | null;
  origin_window_end: string | null;
  destination_facility_name: string | null;
  destination_city: string | null;
  destination_state: string | null;
  destination_zip: string | null;
  delivery_date: string | null;
  destination_window_end: string | null;
  driver_name: string | null;
  truck_number: string | null;
  last_known_lat: number | null;
  last_known_lng: number | null;
  last_ping_at: string | null;
  arrived_at_pickup_at: string | null;
  departed_pickup_at: string | null;
  arrived_at_delivery_at: string | null;
  delivered_at: string | null;
}

function mapRowToTrackedLoad(row: TrackedLoadRow): TrackedLoad {
  return {
    id: row.id,
    status: row.status,
    loadNumber: row.load_number,
    origin: row.origin,
    destination: row.destination,
    originStop: {
      facilityName: row.origin_facility_name,
      city: row.origin_city,
      state: row.origin_state,
      zip: row.origin_zip,
      windowStart: row.pickup_date,
      windowEnd: row.origin_window_end,
    },
    destinationStop: {
      facilityName: row.destination_facility_name,
      city: row.destination_city,
      state: row.destination_state,
      zip: row.destination_zip,
      windowStart: row.delivery_date,
      windowEnd: row.destination_window_end,
    },
    driverName: row.driver_name,
    truckNumber: row.truck_number,
    lastKnownLat: row.last_known_lat,
    lastKnownLng: row.last_known_lng,
    lastPingAt: row.last_ping_at,
    arrivedAtPickupAt: row.arrived_at_pickup_at,
    departedPickupAt: row.departed_pickup_at,
    arrivedAtDeliveryAt: row.arrived_at_delivery_at,
    deliveredAt: row.delivered_at,
  };
}

// Both functions call the SECURITY DEFINER RPCs from
// supabase/migrations/009_tracking.sql instead of querying loads/gps_pings
// directly. Isolation comes entirely from the token: each RPC resolves the
// single load whose tracking_token matches the argument, so an
// unauthenticated caller can never reach any other tenant's load no matter
// what RLS would otherwise allow (there are no anon policies on loads at
// all).
export async function getLoadByTrackingToken(token: string): Promise<TrackedLoad | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("get_load_by_tracking_token", { p_token: token })
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapRowToTrackedLoad(data as unknown as TrackedLoadRow) : null;
}

export interface GpsPing {
  id: string;
  lat: number;
  lng: number;
  recordedAt: string;
}

interface GpsPingRow {
  id: string;
  lat: number;
  lng: number;
  recorded_at: string;
}

// Authenticated, org-scoped read (RLS policy gps_pings_select_own_org from
// supabase/migrations/009_tracking.sql) -- for the dispatcher-facing
// tracking panel, not the public /track/[token] route.
export async function listGpsPings(loadId: string, limit = 50): Promise<GpsPing[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gps_pings")
    .select("id, lat, lng, recorded_at")
    .eq("load_id", loadId)
    .order("recorded_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data as unknown as GpsPingRow[]).map((row) => ({
    id: row.id,
    lat: row.lat,
    lng: row.lng,
    recordedAt: row.recorded_at,
  }));
}

export async function recordTrackingPing(token: string, lat: number, lng: number): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("record_tracking_ping", {
    p_token: token,
    p_lat: lat,
    p_lng: lng,
  });

  if (error) {
    throw error;
  }
}

// Mirrors the whitelist inside advance_tracking_status() in
// supabase/migrations/037_tracking_checkin.sql -- a tracking token may only
// ever request these four driver-facing statuses. Actual legal-transition
// enforcement (e.g. blocking dispatched -> delivered) happens entirely in
// the guard_load_status_transition trigger on the database side, not here.
export type DriverAdvanceableStatus = "at_pickup" | "in_transit" | "at_delivery" | "delivered";

export async function advanceTrackingStatus(
  token: string,
  nextStatus: DriverAdvanceableStatus
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("advance_tracking_status", {
    p_token: token,
    p_next_status: nextStatus,
  });

  if (error) {
    throw error;
  }
}
