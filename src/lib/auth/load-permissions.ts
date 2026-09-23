// Roles that may mutate load records (edit details, cancel, assign carrier).
// Includes legacy coarse-grained values (owner/admin/member) and the granular
// operational roles added in migration 075 (org_admin/broker_agent/
// dispatcher_agent).  Accounts with viewer, accountant, or read_only_viewer
// are read-only for loads.
//
// NOTE: this is a pure predicate with no server-only imports so it can be
// imported in both Server Components (for conditional rendering) and in
// client components (for UI gating).  Actual enforcement is always done on
// the server-action side -- UI hiding is defense-in-depth only.

export const LOAD_WRITE_ROLES = [
  "owner",
  "admin",
  "org_admin",
  "broker_agent",
  "dispatcher_agent",
  "member",
] as const;

export function canWriteLoads(role: string | null | undefined): boolean {
  return LOAD_WRITE_ROLES.includes(role as (typeof LOAD_WRITE_ROLES)[number]);
}
