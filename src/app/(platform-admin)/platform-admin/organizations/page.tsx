import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { OrgTable, type PlatformOrganizationRow } from "@/components/platform-admin/org-table";
import { ErrorState } from "@/components/ui/error-state";
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
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tenant Organizations"
          subtitle="Directory of all provisioned organizations, subscription tiers, and seat allocations."
          breadcrumbs={[
            { label: "Platform Admin", href: "/platform-admin" },
            { label: "Organizations", href: "/platform-admin/organizations" },
          ]}
        />
        <ErrorState
          title="Failed to load platform organizations"
          description={error.message}
        />
      </div>
    );
  }

  const organizations = (data ?? []).map(mapRpcRowToOrganizationRow);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Organizations"
        subtitle="Directory of all provisioned organizations, subscription tiers, and seat allocations."
        breadcrumbs={[
          { label: "Platform Admin", href: "/platform-admin" },
          { label: "Organizations", href: "/platform-admin/organizations" },
        ]}
      />
      <OrgTable organizations={organizations} />
    </div>
  );
}
