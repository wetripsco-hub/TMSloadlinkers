"use server";

import {
  recordTrackingPing,
  advanceTrackingStatus,
  addDriverLoadNote,
  listLoadNotesForTracking,
  type DriverAdvanceableStatus,
  type AdvanceTrackingStatusResult,
  type AddDriverLoadNoteResult,
  type TrackedLoadNote,
} from "@/lib/repositories/tracking";

// No auth/org check here by design -- this route is public. Isolation is
// enforced inside recordTrackingPing, which resolves the load strictly from
// the token argument via a SECURITY DEFINER RPC.
export async function submitTrackingPingAction(
  token: string,
  lat: number,
  lng: number
): Promise<void> {
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    throw new Error("Invalid coordinates");
  }

  await recordTrackingPing(token, lat, lng);
}

// Returns a structured result rather than throwing so the real failure
// reason (guard-trigger rejection vs. genuine error) reaches the client
// intact -- a thrown error here would have its message redacted by Next.js
// in production before the client ever sees it.
export async function submitAdvanceStatusAction(
  token: string,
  nextStatus: DriverAdvanceableStatus
): Promise<AdvanceTrackingStatusResult> {
  return advanceTrackingStatus(token, nextStatus);
}

export async function submitDriverNoteAction(
  token: string,
  note: string
): Promise<AddDriverLoadNoteResult> {
  return addDriverLoadNote(token, note);
}

export async function listDriverLoadNotesAction(token: string): Promise<TrackedLoadNote[]> {
  return listLoadNotesForTracking(token);
}
