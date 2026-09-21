"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { createClient } from "@/lib/supabase/server";
import type { UUID } from "../../../types/domain";

const ACCOUNT_STATUSES = ["active", "suspended"] as const;
type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export async function setOrgStatus(orgId: UUID, status: AccountStatus, reason?: string) {
  if (!ACCOUNT_STATUSES.includes(status)) {
    throw new Error("Invalid account status");
  }
  if (status === "suspended" && !reason?.trim()) {
    throw new Error("A reason is required to suspend an organization");
  }

  await requirePlatformAdmin();

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_organization_account_status", {
    p_org_id: orgId,
    p_status: status,
    p_reason: reason?.trim() || undefined,
  });

  if (error) throw error;

  revalidatePath("/platform-admin/organizations");
  revalidatePath("/platform-admin/audit-log");
}

export async function startOrgPreview(orgId: UUID, reason?: string): Promise<UUID> {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_platform_admin_preview", {
    p_org_id: orgId,
    p_reason: reason?.trim() || undefined,
  });

  if (error) throw error;

  return data as UUID;
}

export async function endOrgPreview(logId: UUID) {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const { error } = await supabase.rpc("end_platform_admin_preview", {
    p_log_id: logId,
  });

  if (error) throw error;
}
