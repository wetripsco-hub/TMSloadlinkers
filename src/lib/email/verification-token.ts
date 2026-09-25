import "server-only";
import { randomBytes } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";

const TOKEN_TTL_DAYS = 30;

export async function createVerificationToken(profileId: string): Promise<string> {
  const supabase = createServiceClient();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("email_verification_tokens").insert({
    profile_id: profileId,
    token,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Failed to create verification token: ${error.message}`);
  }

  return token;
}

export function buildVerifyUrl(token: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${siteUrl}/api/verify-email?token=${token}`;
}
