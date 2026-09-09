"use server";

import {
  recordTrackingPing,
  advanceTrackingStatus,
  type DriverAdvanceableStatus,
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

export async function submitAdvanceStatusAction(
  token: string,
  nextStatus: DriverAdvanceableStatus
): Promise<void> {
  await advanceTrackingStatus(token, nextStatus);
}
