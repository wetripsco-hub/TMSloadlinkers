import { createClient } from "@/lib/supabase/server";
import { PageBreadcrumb } from "@/components/common/PageBreadCrumb";
import { OrgTable, type PlatformOrganizationRow } from "@/components/platform-admin/org-table";
import type { Database } from "../../../../../types/database";

export const dynamic = "force-dynamic";

type PlatformOrgRpcRow =
  Database["public"]["Functions"]["get_platform_organizations"]["Returns"][number];

function mapRpcRowToOrganizationRow(row: PlatformOrgRpcRow): PlatformOrganizationRow {
  return {
    orgId: row.org_id,
    name: row.name,
    workspaceType: row.workspace_type,
    planTier: row.plan_tier,
    subscriptionState: row.subscription_state,
    seatCount: row.seat_count,
    trialEndsAt: row.trial_ends_at,
    createdAt: row.created_at,
  };
}

export default async function PlatformAdminOrganizationsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_platform_organizations");

  if (error) {
    throw new Error(`Failed to load platform organizations: ${error.message}`);
  }

  const organizations = (data ?? []).map(mapRpcRowToOrganizationRow);

  return (
    <div className="space-y-6 p-6">
      <PageBreadcrumb pageTitle="Organizations" />
      <OrgTable organizations={organizations} />
    </div>
  );
}
