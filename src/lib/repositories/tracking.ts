import { createClient } from "@/lib/supabase/server";
import type { DocumentType, LoadStatus, OcrStatus } from "../../../types/domain";

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

export type AdvanceTrackingStatusErrorCode = "illegal_transition" | "not_whitelisted" | "invalid_token" | "unknown";

export type AdvanceTrackingStatusResult =
  | { success: true }
  | { success: false; errorCode: AdvanceTrackingStatusErrorCode; message: string };

// advance_tracking_status() (037_tracking_checkin.sql) and the
// guard_load_status_transition() trigger it runs through
// (006_load_status_domain_alignment.sql) both fail via plain
// `raise exception '...'` with no `using errcode = ...`. Postgres therefore
// assigns every one of them the same generic SQLSTATE, P0001
// ("raise_exception"), which PostgREST forwards verbatim as
// PostgrestError.code -- so `error.code` cannot distinguish "illegal
// transition" from "not on the driver whitelist" from "bad token"; only the
// raised message text differs between them. Matching on that text is done
// right here, server-side, against the real PostgrestError straight off the
// RPC call -- not client-side, and not after Next.js's production Server
// Action error redaction (which only strips *thrown*/uncaught errors before
// they leave the server). This function classifies the error once, while it
// still has the real message, and returns a small structured, already-safe
// result; nothing about that value is touched by redaction because it is
// never thrown.
function classifyAdvanceTrackingStatusError(message: string): AdvanceTrackingStatusErrorCode {
  if (message.includes("illegal load status transition")) return "illegal_transition";
  if (message.includes("may not set status to")) return "not_whitelisted";
  if (message.includes("Invalid tracking token")) return "invalid_token";
  return "unknown";
}

export async function advanceTrackingStatus(
  token: string,
  nextStatus: DriverAdvanceableStatus
): Promise<AdvanceTrackingStatusResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("advance_tracking_status", {
    p_token: token,
    p_next_status: nextStatus,
  });

  if (!error) {
    return { success: true };
  }

  return {
    success: false,
    errorCode: classifyAdvanceTrackingStatusError(error.message),
    message: error.message,
  };
}

export type AddDriverLoadNoteResult =
  | { success: true }
  | { success: false; message: string };

// add_driver_load_note (050_load_notes.sql) reports every failure (invalid
// token, empty/over-length note, 30-second cooldown) via a plain `raise
// exception` with a distinct message, same convention as
// advance_tracking_status. There's no need to classify into an error code
// here the way classifyAdvanceTrackingStatusError does -- the driver-facing
// UI just shows the message text directly -- but the error is still caught
// and returned as data rather than thrown, so Next.js's production error
// redaction never strips it before the client sees it.
export async function addDriverLoadNote(token: string, note: string): Promise<AddDriverLoadNoteResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("add_driver_load_note", {
    p_token: token,
    p_note: note,
  });

  if (!error) {
    return { success: true };
  }

  return { success: false, message: error.message };
}

export interface TrackedLoadNote {
  id: string;
  authorType: "staff" | "driver";
  authorLabel: string;
  noteText: string;
  createdAt: string;
}

interface TrackedLoadNoteRow {
  id: string;
  author_type: string;
  author_label: string;
  note_text: string;
  created_at: string;
}

// list_load_notes_for_tracking (051_list_load_notes_for_tracking.sql) is the
// anon-side read path for the same load_notes table load_notes_select_own_org
// (050_load_notes.sql) covers for authenticated staff -- same
// token-resolves-strictly-one-load security model as list_tracking_documents,
// returns both author_type values so the driver sees the full thread
// including staff replies, not just their own messages.
export async function listLoadNotesForTracking(token: string): Promise<TrackedLoadNote[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("list_load_notes_for_tracking", { p_token: token });

  if (error) {
    throw error;
  }

  return (data as unknown as TrackedLoadNoteRow[]).map((row) => ({
    id: row.id,
    authorType: row.author_type as "staff" | "driver",
    authorLabel: row.author_label,
    noteText: row.note_text,
    createdAt: row.created_at,
  }));
}

export interface TrackedDocument {
  id: string;
  documentType: DocumentType | null;
  ocrStatus: OcrStatus;
  createdAt: string;
}

interface TrackedDocumentRow {
  id: string;
  document_type: string | null;
  ocr_status: string;
  created_at: string;
}

// list_tracking_documents (040_tracking_document_list.sql) is metadata-only
// by design -- it deliberately does not return file_url, and there is no
// anon storage read policy on the load-documents bucket, so a signed URL
// isn't something this can offer yet either.
export async function listTrackingDocuments(token: string): Promise<TrackedDocument[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("list_tracking_documents", { p_token: token });

  if (error) {
    throw error;
  }

  return (data as unknown as TrackedDocumentRow[]).map((row) => ({
    id: row.id,
    documentType: row.document_type as DocumentType | null,
    ocrStatus: row.ocr_status as OcrStatus,
    createdAt: row.created_at,
  }));
}
