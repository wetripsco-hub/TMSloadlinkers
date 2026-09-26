import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole, type AdminRole } from "@/lib/auth/admin-role";
import type { UUID } from "../../../types/domain";

export type { AdminRole };

export interface AdminContext {
  userId: UUID;
  orgId: UUID;
  role: AdminRole;
}

export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.org_id) return null;
  if (!isAdminRole(profile.role)) return null;

  return {
    userId: user.id as UUID,
    orgId: profile.org_id as UUID,
    role: profile.role,
  };
}

export interface OwnerContext {
  userId: UUID;
  orgId: UUID;
}

// Stricter than getAdminContext: "admin" is deliberately excluded here.
// Editing an existing customer/carrier record can quietly rewrite billing
// or dispatch contact details on a live account, so that's scoped to
// "owner" only rather than the wider admin set.
export async function getOwnerContext(): Promise<OwnerContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.org_id) return null;
  if (profile.role !== "owner") return null;

  return {
    userId: user.id as UUID,
    orgId: profile.org_id as UUID,
  };
}
