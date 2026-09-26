// Shared, import-safe (no "server-only") home for the owner/admin role
// check. lib/auth/require-admin.ts's getAdminContext() uses this to decide
// who may reach the settings/team pages (every settings/*/page.tsx redirects
// non-admins to /overview), and AppSidebar.tsx -- a client component that
// can't import require-admin.ts without pulling "server-only" into the
// client bundle -- uses the exact same predicate to decide whether to show
// the Settings link, so the two checks can never drift apart.
export type AdminRole = "owner" | "admin";

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return role === "owner" || role === "admin";
}

// Stricter than isAdminRole: used to gate editing an existing
// customer/carrier record, which is scoped to "owner" only (see
// require-admin.ts's getOwnerContext for the server-side enforcement).
export function isOwnerRole(role: string | null | undefined): boolean {
  return role === "owner";
}
