import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UUID } from "../../../types/domain";

export type AdminRole = "owner" | "admin";

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
  if (profile.role !== "owner" && profile.role !== "admin") return null;

  return {
    userId: user.id as UUID,
    orgId: profile.org_id as UUID,
    role: profile.role,
  };
}
