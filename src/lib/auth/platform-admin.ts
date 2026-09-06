import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UUID } from "../../../types/domain";

export interface PlatformAdminContext {
  userId: UUID;
}

// Unlike getAdminContext() (org-scoped owner/admin), this checks the
// separate platform_admins table via is_platform_admin() (021_platform_
// admin.sql) -- a platform admin is not necessarily a member of any
// tenant org at all. Redirects rather than returning null: every caller
// of this in a server component/action wants "kick the user out", not a
// null to branch on.
export async function requirePlatformAdmin(): Promise<PlatformAdminContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: isAdmin, error } = await supabase.rpc("is_platform_admin", {
    uid: user.id,
  });

  if (error || !isAdmin) {
    redirect("/overview");
  }

  return { userId: user.id as UUID };
}
