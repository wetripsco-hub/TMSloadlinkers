import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
    "/loads",
    "/carriers",
    "/customers",
    "/invoices",
    "/settlements",
    "/documents",
  ];
  const isDashboardRoute = DASHBOARD_PREFIXES.some(
    (prefix) => request.nextUrl.pathname === prefix || request.nextUrl.pathname.startsWith(`${prefix}/`)
  );

  if (!user && isDashboardRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
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
    "/loads/:path*",
    "/carriers/:path*",
    "/customers/:path*",
    "/invoices/:path*",
    "/settlements/:path*",
    "/documents/:path*",
    "/platform-admin/:path*",
  ],
};
