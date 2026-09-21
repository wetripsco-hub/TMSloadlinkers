"use server";

import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { createClient } from "@/lib/supabase/server";
import type { UUID } from "../../../types/domain";

export interface PlatformOrgOption {
  orgId: UUID;
  name: string;
}

export async function listOrganizationsForNotificationPicker(): Promise<PlatformOrgOption[]> {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_platform_organizations");

  if (error) throw error;

  return (data ?? [])
    .map((row) => ({ orgId: row.org_id, name: row.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface PlatformUserOption {
  userId: UUID;
  fullName: string | null;
  email: string | null;
  orgName: string | null;
}

export async function listUsersForNotificationPicker(): Promise<PlatformUserOption[]> {
  await requirePlatformAdmin();

  const supabase = await createClient();
  // organizations has two FKs to/from profiles (profiles.org_id and
  // organizations.suspended_by), so the embed is ambiguous to PostgREST
  // without pinning it to the org-membership one by name.
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, organizations!profiles_org_id_fkey(name)")
    .order("full_name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    userId: row.id,
    fullName: row.full_name,
    email: row.email,
    orgName: row.organizations?.name ?? null,
  }));
}

export type NotificationTarget =
  | { type: "org"; orgId: UUID }
  | { type: "user"; userId: UUID }
  | { type: "all" };

export async function sendAdminNotificationAction(
  target: NotificationTarget,
  title: string,
  body: string
): Promise<number> {
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  if (!trimmedTitle) throw new Error("Title is required");
  if (!trimmedBody) throw new Error("Message is required");

  await requirePlatformAdmin();

  const supabase = await createClient();
  // Generated Args types (types/database.ts) don't carry the SQL function's
  // uuid params as nullable even though it accepts and expects null for
  // the two inapplicable targets -- the codegen has no way to know that
  // from the parameter list alone. Runtime accepts null regardless.
  const { data, error } = await supabase.rpc("send_admin_notification", {
    p_target_type: target.type,
    p_target_org_id: (target.type === "org" ? target.orgId : null) as unknown as string,
    p_target_user_id: (target.type === "user" ? target.userId : null) as unknown as string,
    p_title: trimmedTitle,
    p_body: trimmedBody,
  });

  if (error) throw error;

  return data ?? 0;
}
