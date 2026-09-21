"use server";

import { createElement } from "react";
import { sendEmail } from "@/lib/email/client";

export interface EnterpriseInquiryInput {
  name: string;
  email: string;
  message: string;
}

export interface EnterpriseInquiryResult {
  error?: string;
  ok?: true;
}

export async function submitEnterpriseInquiry(
  input: EnterpriseInquiryInput
): Promise<EnterpriseInquiryResult> {
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();

  if (!name) return { error: "Name is required" };
  if (!email || !email.includes("@")) return { error: "A valid email is required" };
  if (!message) return { error: "Message is required" };

  const inbox = process.env.SUPPORT_NOTIFICATION_EMAIL;
  if (!inbox) {
    return { error: "Enterprise inquiries aren't configured yet — please try again later." };
  }

  try {
    await sendEmail({
      to: inbox,
      subject: `[Enterprise inquiry] ${name}`,
      react: createElement(
        "div",
        null,
        createElement("p", null, `New Enterprise inquiry from the landing page.`),
        createElement("p", null, `Name: ${name}`),
        createElement("p", null, `Email: ${email}`),
        createElement("p", null, message)
      ),
    });
  } catch (emailError) {
    console.error("Failed to send enterprise inquiry email:", emailError);
    return { error: "Something went wrong sending your message. Please try again." };
  }

  return { ok: true };
}
