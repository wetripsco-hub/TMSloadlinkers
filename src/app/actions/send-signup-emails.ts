"use server";

import { resend, EMAIL_FROM, EMAIL_REPLY_TO, ADMIN_ALERT_EMAIL } from "@/lib/email/resend";
import { WelcomeEmail } from "@/lib/email/templates/welcome-email";
import { AdminSignupAlert } from "@/lib/email/templates/admin-signup-alert";
import { createVerificationToken, buildVerifyUrl } from "@/lib/email/verification-token";

export interface SignupEmailPayload {
  userId: string;
  brokerEmail: string;
  brokerName: string;
  companyName: string;
  selectedPlan: string;
  mcNumber?: string;
}

export async function sendSignupEmails({
  userId,
  brokerEmail,
  brokerName,
  companyName,
  selectedPlan,
  mcNumber = "",
}: SignupEmailPayload): Promise<void> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/overview`;
  const token = await createVerificationToken(userId);
  const verifyUrl = buildVerifyUrl(token);

  await Promise.allSettled([
    resend.emails.send({
      from: EMAIL_FROM,
      replyTo: EMAIL_REPLY_TO,
      to: brokerEmail,
      subject: "Welcome to Loadlinkers — verify your email to keep your 7-day trial",
      react: WelcomeEmail({ recipientName: brokerName, dashboardUrl, verifyUrl }),
    }),
    resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_ALERT_EMAIL,
      subject: `New signup: ${companyName}`,
      react: AdminSignupAlert({ companyName, mcNumber, brokerName, brokerEmail, selectedPlan }),
    }),
  ]);
}
