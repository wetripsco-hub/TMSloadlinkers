import type { LoadStatus } from "../../../types/domain";

// Mirrors the `guard_load_status_transition` trigger in
// supabase/migrations/006_load_status_domain_alignment.sql exactly: a single
// legal forward chain, plus every status may transition to `cancelled`.
// Keep this array in sync with that trigger if either changes.
export const LOAD_STATUS_FORWARD_CHAIN: LoadStatus[] = [
  "quoted",
  "posted_to_boards",
  "covered",
  "dispatched",
  "at_pickup",
  "in_transit",
  "at_delivery",
  "delivered",
  "pod_uploaded",
  "invoiced",
  "settled",
];

export function getNextStatus(current: LoadStatus): LoadStatus | null {
  const index = LOAD_STATUS_FORWARD_CHAIN.indexOf(current);
  if (index === -1 || index === LOAD_STATUS_FORWARD_CHAIN.length - 1) {
    return null;
  }
  return LOAD_STATUS_FORWARD_CHAIN[index + 1];
}

export function isTerminalStatus(status: LoadStatus): boolean {
  return status === "settled" || status === "cancelled";
}

export function canAdvance(current: LoadStatus, next: LoadStatus): boolean {
  return getNextStatus(current) === next;
}
