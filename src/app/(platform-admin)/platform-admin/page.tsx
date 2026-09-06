import { Building2, Users, Clock3, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import { ErrorState } from "@/components/ui/error-state";
import type { Database } from "../../../../types/database";

export const dynamic = "force-dynamic";

type PlatformOrgRpcRow =
  Database["public"]["Functions"]["get_platform_organizations"]["Returns"][number];

export default async function PlatformAdminDashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_platform_organizations");

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Platform Administration"
          subtitle="System-wide overview, multi-tenant fleet health, and operational diagnostics."
        />
        <ErrorState
          title="Failed to load platform organizations"
          description={error.message}
        />
      </div>
    );
  }

  const organizations: PlatformOrgRpcRow[] = data ?? [];

  const totalCompanies = organizations.length;
  const trialCount = organizations.filter((o) => o.subscription_state === "trialing").length;
  const paidCount = organizations.filter(
    (o) => o.subscription_state && o.subscription_state !== "trialing"
  ).length;

  const recentSignups = [...organizations]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Administration"
        subtitle="System-wide overview, multi-tenant fleet health, and operational diagnostics."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total companies"
          value={totalCompanies}
          icon={<Building2 className="h-6 w-6 text-brand-500" />}
          subtitle="Onboarded organizations across all regions"
          variant="plausible"
        />
        <MetricCard
          title="Trialing"
          value={trialCount}
          icon={<Clock3 className="h-6 w-6 text-amber-500" />}
          badgeColor="warning"
          subtitle="Organizations evaluating platform"
          variant="plausible"
        />
        <MetricCard
          title="Paid"
          value={paidCount}
          icon={<CreditCard className="h-6 w-6 text-emerald-500" />}
          badgeColor="success"
          subtitle="Active converted tenant subscriptions"
          variant="plausible"
        />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Users className="h-4 w-4 text-slate-400" />
          Recent tenant signups
        </h3>
        {recentSignups.length === 0 ? (
          <p className="text-sm text-slate-400">No organizations yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentSignups.map((org) => (
              <li key={org.org_id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{org.name}</span>
                  <span
                    title="Tenant Org UUID (click to select and copy)"
                    className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 select-all border border-slate-200/60"
                  >
                    {org.org_id}
                  </span>
                </div>
                <span className="text-slate-400 text-xs">
                  {new Date(org.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
