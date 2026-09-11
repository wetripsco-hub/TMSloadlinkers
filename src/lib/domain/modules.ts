// Single source of truth for the app's module-level access control
// (allowed_modules on profiles/invitations -- see
// supabase/migrations/044_profile_invite_allowed_modules.sql). AppSidebar,
// middleware.ts, and the team settings UI all import from here instead of
// keeping their own copies of this list, so a module's route or label can't
// drift between where it's checked and where it's shown.
//
// No "use server"/"server-only" imports here on purpose -- both the client
// sidebar and the edge middleware need to import this module directly.

export const APP_MODULE_KEYS = [
  "overview",
  "loads",
  "carriers",
  "customers",
  "invoices",
  "settlements",
  "reports",
  "documents",
  "review_queue",
  "driver_tracking",
] as const;

export type ModuleKey = (typeof APP_MODULE_KEYS)[number];

export interface AppModule {
  key: ModuleKey;
  label: string;
  pathPrefix: string;
}

// pathPrefix values match src/layout/AppSidebar.tsx's nav item paths
// exactly. review_queue's prefix is nested under documents's, so path
// resolution below always prefers the longest (most specific) match.
export const APP_MODULES: AppModule[] = [
  { key: "overview", label: "Overview", pathPrefix: "/overview" },
  { key: "loads", label: "Loads", pathPrefix: "/loads" },
  { key: "carriers", label: "Carriers", pathPrefix: "/carriers" },
  { key: "customers", label: "Customers", pathPrefix: "/customers" },
  { key: "invoices", label: "Invoices", pathPrefix: "/invoices" },
  { key: "settlements", label: "Settlements", pathPrefix: "/settlements" },
  { key: "reports", label: "Reports", pathPrefix: "/reports" },
  { key: "review_queue", label: "Review Queue", pathPrefix: "/documents/review" },
  { key: "documents", label: "Documents", pathPrefix: "/documents" },
  { key: "driver_tracking", label: "Driver Tracking", pathPrefix: "/driver-tracking" },
];

export function isModuleKey(value: string): value is ModuleKey {
  return (APP_MODULE_KEYS as readonly string[]).includes(value);
}

// Longest-prefix match so /documents/review resolves to review_queue, not
// documents, regardless of APP_MODULES's array order.
export function resolveModuleForPath(pathname: string): AppModule | undefined {
  let best: AppModule | undefined;
  for (const appModule of APP_MODULES) {
    const matches = pathname === appModule.pathPrefix || pathname.startsWith(`${appModule.pathPrefix}/`);
    if (matches && (!best || appModule.pathPrefix.length > best.pathPrefix.length)) {
      best = appModule;
    }
  }
  return best;
}

// Owners are always unrestricted regardless of allowed_modules's contents
// -- enforced here, in code, never in the DB, so a bad allowed_modules
// value can never lock an owner out of their own org.
export function isModuleAllowed(
  role: string | null | undefined,
  allowedModules: readonly string[] | null | undefined,
  moduleKey: ModuleKey
): boolean {
  if (role === "owner") return true;
  return (allowedModules ?? []).includes(moduleKey);
}

// Rendered by /no-access when a restricted member's allowed_modules is
// empty (no other module route to fall back to).
export const NO_ACCESS_PATH = "/no-access";

// Where to send someone instead of a hardcoded '/overview' now that
// 'overview' is itself a gated module -- avoids landing a restricted
// member on a page middleware will just bounce them off of again.
// Owners are always unrestricted, so they still land on '/overview'.
export function firstAllowedModulePath(
  allowedModules: readonly string[] | null | undefined,
  role: string | null | undefined
): string {
  if (role === "owner") return "/overview";

  const modules = allowedModules ?? [];
  const firstAllowed = APP_MODULES.find((appModule) => modules.includes(appModule.key));
  return firstAllowed?.pathPrefix ?? NO_ACCESS_PATH;
}
