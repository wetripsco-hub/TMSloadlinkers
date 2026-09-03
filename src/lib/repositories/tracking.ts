import { createClient } from "@/lib/supabase/server";
import type { LoadStatus } from "../../../types/domain";

export interface TrackedLoad {
  id: string;
  status: LoadStatus;
  origin: string | null;
  destination: string | null;
  driverName: string | null;
  truckNumber: string | null;
  lastKnownLat: number | null;
  lastKnownLng: number | null;
  lastPingAt: string | null;
}

interface TrackedLoadRow {
  id: string;
  status: LoadStatus;
  origin: string | null;
  destination: string | null;
  driver_name: string | null;
  truck_number: string | null;
  last_known_lat: number | null;
  last_known_lng: number | null;
  last_ping_at: string | null;
}

function mapRowToTrackedLoad(row: TrackedLoadRow): TrackedLoad {
  return {
    id: row.id,
    status: row.status,
    origin: row.origin,
    destination: row.destination,
    driverName: row.driver_name,
    truckNumber: row.truck_number,
    lastKnownLat: row.last_known_lat,
    lastKnownLng: row.last_known_lng,
    lastPingAt: row.last_ping_at,
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
