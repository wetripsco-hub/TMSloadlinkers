"use server";

// Shared by two disjoint route trees -- (dashboard)/settings/danger-zone
// (tenant) and (platform-admin)/platform-admin/reset-requests (admin) --
// same reasoning as app/actions/tickets.ts for breaking from this repo's
// usual "actions.ts colocated with its one route" convention.

import { randomInt, createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/auth/require-admin";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/client";
import { OtpCodeEmail } from "@/lib/email/templates/otp-code";
import type { UUID } from "../../../types/domain";

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function requestDataReset() {
  const admin = await getAdminContext();
  if (!admin) {
    throw new Error("You must be an org admin to request a data reset");
  }

  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("data_reset_requests")
    .select("id, status")
    .eq("org_id", admin.orgId)
    .in("status", ["pending_email", "pending_approval"])
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) {
    throw new Error(
      `A reset request is already ${existing.status === "pending_email" ? "awaiting your code entry" : "awaiting Loadlinkers approval"}`
    );
  }

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("contact_email")
    .eq("id", admin.orgId)
    .maybeSingle();

  if (orgError) throw orgError;
  if (!org?.contact_email) {
    throw new Error(
      "Set a contact email in Organization Settings before requesting a data reset"
    );
  }

  const code = generateOtpCode();

  const { data: request, error: insertError } = await supabase
    .from("data_reset_requests")
    .insert({
      org_id: admin.orgId,
      requested_by: admin.userId,
      otp_code_hash: hashCode(code),
    })
    .select("id")
    .single();

  if (insertError) throw insertError;

  await sendEmail({
    to: org.contact_email,
    subject: "Confirm your data reset request",
    react: OtpCodeEmail({ code }),
  });

  revalidatePath("/settings/danger-zone");

  return { requestId: request.id as UUID };
}

export async function verifyDataResetCode(requestId: UUID, code: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("verify_data_reset_otp", {
    p_request_id: requestId,
    p_code: code,
  });

  if (error) throw error;

  revalidatePath("/settings/danger-zone");

  return data === true;
}

export async function approveResetRequest(requestId: UUID) {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_data_reset_request", {
    p_request_id: requestId,
  });

  if (error) throw error;

  revalidatePath("/platform-admin/reset-requests");
}

export async function rejectResetRequest(requestId: UUID, reason: string) {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_data_reset_request", {
    p_request_id: requestId,
    p_reason: reason,
  });

  if (error) throw error;

  revalidatePath("/platform-admin/reset-requests");
}
