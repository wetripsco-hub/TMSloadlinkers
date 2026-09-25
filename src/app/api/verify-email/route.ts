import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const loginUrl = new URL("/login", request.nextUrl.origin);

  if (!token) {
    loginUrl.searchParams.set("verified", "invalid");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createServiceClient();

  const { data: tokenRow } = await supabase
    .from("email_verification_tokens")
    .select("id, profile_id, expires_at, consumed_at")
    .eq("token", token)
    .maybeSingle();

  if (!tokenRow || tokenRow.consumed_at || new Date(tokenRow.expires_at) < new Date()) {
    loginUrl.searchParams.set("verified", "invalid");
    return NextResponse.redirect(loginUrl);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ email_verified_at: new Date().toISOString() })
    .eq("id", tokenRow.profile_id);

  if (profileError) {
    loginUrl.searchParams.set("verified", "invalid");
    return NextResponse.redirect(loginUrl);
  }

  await supabase
    .from("email_verification_tokens")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", tokenRow.id);

  loginUrl.searchParams.set("verified", "success");
  return NextResponse.redirect(loginUrl);
}
