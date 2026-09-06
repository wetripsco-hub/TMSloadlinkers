import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { DangerZonePanel } from "@/components/settings/danger-zone-panel";

export const dynamic = "force-dynamic";

export default async function DangerZonePage() {
  const admin = await getAdminContext();

  if (!admin) {
    redirect("/overview");
  }

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("data_reset_requests")
    .select("id, status")
    .eq("org_id", admin.orgId)
    .in("status", ["pending_email", "pending_approval"])
    .maybeSingle();

  return <DangerZonePanel initialRequest={request ?? null} />;
}
