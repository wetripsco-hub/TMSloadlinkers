import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveModuleForPath, isModuleAllowed, firstAllowedModulePath } from "@/lib/domain/modules";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const DASHBOARD_PREFIXES = [
    "/overview",
    "/loads",
    "/carriers",
    "/customers",
    "/invoices",
    "/settlements",
    "/documents",
    "/reports",
    "/driver-tracking",
  ];
  const isDashboardRoute = DASHBOARD_PREFIXES.some(
    (prefix) => request.nextUrl.pathname === prefix || request.nextUrl.pathname.startsWith(`${prefix}/`)
  );

  if (!user && isDashboardRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Per-member module visibility/routing (lib/domain/modules.ts). This is
  // NOT tenant isolation -- org_id/RLS already scopes every query
  // regardless of this check; a restricted member who somehow reached a
  // module's data would still only ever see their own org's rows. This
  // only decides whether they're allowed to navigate to the route at all.
  if (user && isDashboardRoute) {
    const matchedModule = resolveModuleForPath(request.nextUrl.pathname);
    if (matchedModule) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, allowed_modules")
        .eq("id", user.id)
        .maybeSingle();

      if (!isModuleAllowed(profile?.role, profile?.allowed_modules, matchedModule.key)) {
        // 'overview' is itself gated now, so the old hardcoded '/overview'
        // fallback could send a restricted member straight back into
        // another redirect -- land on the first module they actually have.
        const fallbackPath = firstAllowedModulePath(profile?.allowed_modules, profile?.role);
        const redirectUrl = new URL(fallbackPath, request.url);
        redirectUrl.searchParams.set("restricted", matchedModule.key);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  const isPlatformAdminRoute =
    request.nextUrl.pathname === "/platform-admin" ||
    request.nextUrl.pathname.startsWith("/platform-admin/");

  if (isPlatformAdminRoute) {
    if (!user) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // A platform admin is not necessarily a member of any tenant org, so
    // this checks the separate platform_admins table (021_platform_admin.sql)
    // via is_platform_admin(), not profiles.role.
    const { data: isPlatformAdmin } = await supabase.rpc("is_platform_admin", {
      uid: user.id,
    });

    if (!isPlatformAdmin) {
      return NextResponse.redirect(new URL("/overview", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/overview/:path*",
    "/loads/:path*",
    "/carriers/:path*",
    "/customers/:path*",
    "/invoices/:path*",
    "/settlements/:path*",
    "/documents/:path*",
    "/reports/:path*",
    "/driver-tracking/:path*",
    "/platform-admin/:path*",
  ],
};
