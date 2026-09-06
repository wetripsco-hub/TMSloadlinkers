import { Building2, Users, Clock3, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageBreadcrumb } from "@/components/common/PageBreadCrumb";
import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import type { Database } from "../../../../types/database";

export const dynamic = "force-dynamic";

type PlatformOrgRpcRow =
  Database["public"]["Functions"]["get_platform_organizations"]["Returns"][number];

export default async function PlatformAdminDashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_platform_organizations");

  if (error) {
    throw new Error(`Failed to load platform organizations: ${error.message}`);
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
    <div className="space-y-6 p-6">
      <PageBreadcrumb pageTitle="Platform Admin" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total companies"
          value={totalCompanies}
          icon={<Building2 className="h-6 w-6 text-brand-500" />}
          subtitle="Onboarded organizations"
          variant="plausible"
        />
        <MetricCard
          title="Trialing"
          value={trialCount}
          icon={<Clock3 className="h-6 w-6 text-amber-500" />}
          badgeColor="warning"
          subtitle="Not yet converted"
          variant="plausible"
        />
        <MetricCard
          title="Paid"
          value={paidCount}
          icon={<CreditCard className="h-6 w-6 text-emerald-500" />}
          badgeColor="success"
          subtitle="Active/past_due/canceled subscriptions"
          variant="plausible"
        />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Users className="h-4 w-4 text-slate-400" />
          Recent signups
        </h3>
        {recentSignups.length === 0 ? (
          <p className="text-sm text-slate-400">No organizations yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentSignups.map((org) => (
              <li key={org.org_id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-slate-900">{org.name}</span>
                <span className="text-slate-400">
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
