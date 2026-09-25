"use server";

import { createClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/resend";
import { WelcomeEmail } from "@/lib/email/templates/welcome-email";
import { createVerificationToken, buildVerifyUrl } from "@/lib/email/verification-token";

export async function resendVerificationEmail(): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to resend a verification email." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, email_verified_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return { error: "Profile not found." };
  }

  if (profile.email_verified_at) {
    return { error: null };
  }

  const recipientEmail = profile.email ?? user.email;

  if (!recipientEmail) {
    return { error: "No email address on file." };
  }

  const token = await createVerificationToken(user.id);
  const verifyUrl = buildVerifyUrl(token);
  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/overview`;

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    replyTo: EMAIL_REPLY_TO,
    to: recipientEmail,
    subject: "Verify your email address — Loadlinkers",
    react: WelcomeEmail({
      recipientName: profile.full_name ?? "there",
      dashboardUrl,
      verifyUrl,
    }),
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
