import type { Metadata } from "next";
import Link from "next/link";
import {
  getCurrentSubscription,
  getKpiSummary,
  getLoadsByStatus,
  getRevenueByWeek,
  getTopCustomers,
} from "@/lib/repositories/dashboard";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { EmptyStateChecklist } from "@/components/dashboard/empty-state-checklist";
import { RevenueMarginChart } from "@/components/dashboard/revenue-margin-chart";
import { LoadsStatusDonut } from "@/components/dashboard/loads-status-donut";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney, formatNullableNumber } from "@/lib/format";
import {
  Building2,
  CircleDollarSign,
  Package,
  Plus,
  Receipt,
  Truck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Overview | FreightLink TMS",
};

export default async function OverviewPage() {
  const [subscription, kpi, revenueByWeek, loadsByStatus, topCustomers] = await Promise.all([
    getCurrentSubscription(),
    getKpiSummary(),
    getRevenueByWeek(),
    getLoadsByStatus(),
    getTopCustomers(),
  ]);

  const totalLoads = loadsByStatus.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Overview"
        subtitle="Real-time freight brokerage KPIs, active shipments, and financial performance."
        breadcrumbs={[{ label: "Operations", href: "/overview" }]}
        action={
          <div className="flex items-center gap-2.5">
            <Link
              href="/customers"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <Building2 className="h-3.5 w-3.5 text-slate-500" />
              Directory
            </Link>
            <Link
              href="/loads"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              New Load
            </Link>
          </div>
        }
      />

      <TrialBanner subscription={subscription} />

      {totalLoads === 0 ? (
        <EmptyStateChecklist />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/loads" className="block">
              <MetricCard
                title="Gross Margin (MTD)"
                value={formatMoney(kpi.grossMarginMtdCents)}
                icon={<CircleDollarSign className="h-5 w-5 text-emerald-600" />}
                badgeText={
                  kpi.marginPercent != null && !Number.isNaN(kpi.marginPercent)
                    ? `${kpi.marginPercent.toFixed(1)}%`
                    : "No data"
                }
                badgeColor="success"
                subtitle="Broker margin this month"
                variant="plausible"
              />
            </Link>

            <Link href="/loads?status=active" className="block">
              <MetricCard
                title="Active Loads"
                value={formatNullableNumber(kpi.activeLoads)}
                icon={<Package className="h-5 w-5 text-indigo-600" />}
                badgeText="In Pipeline"
                badgeColor="primary"
                subtitle="Not cancelled or settled"
                variant="plausible"
              />
            </Link>

            <Link href="/invoices" className="block">
              <MetricCard
                title="Outstanding AR"
                value={formatMoney(kpi.outstandingArCents)}
                icon={<Receipt className="h-5 w-5 text-amber-600" />}
                badgeText={(kpi.outstandingArCents ?? 0) > 0 ? "Unpaid" : "Clear"}
                badgeColor={(kpi.outstandingArCents ?? 0) > 0 ? "warning" : "light"}
                subtitle="Shipper invoices not yet paid"
                variant="plausible"
              />
            </Link>

            <Link href="/loads?status=in_transit" className="block">
              <MetricCard
                title="In-Transit"
                value={formatNullableNumber(kpi.inTransit)}
                icon={<Truck className="h-5 w-5 text-sky-600" />}
                badgeText="On Highway"
                badgeColor="info"
                subtitle="GPS tracking & rolling"
                variant="plausible"
              />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-6 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Revenue vs. Margin
                </h3>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  Last 12 weeks
                </span>
              </div>
              <div className="mt-4">
                <RevenueMarginChart data={revenueByWeek} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Loads by Status
                </h3>
              </div>
              <div className="mt-4">
                <LoadsStatusDonut data={loadsByStatus} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">Top Customers</h3>
              <span className="text-xs font-medium text-slate-500">By MTD Revenue</span>
            </div>
            {topCustomers.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={Building2}
                  title="No revenue booked this month"
                  description="Shippers and their generated MTD freight revenue will rank here once invoices are issued."
                  action={{
                    label: "View Customer Accounts",
                    href: "/customers",
                  }}
                  className="border-none bg-slate-50/50 p-6 shadow-none sm:p-8"
                />
              </div>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100">
                {topCustomers.map((customer, index) => (
                  <li
                    key={customer.customerId}
                    className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-xs font-semibold text-slate-600">
                      {index + 1}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium text-slate-900">
                      {customer.companyName}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {formatNullableNumber(customer.loadCount)} load{customer.loadCount === 1 ? "" : "s"}
                    </span>
                    <span className="w-28 text-right font-mono text-sm font-semibold tabular-nums text-slate-900">
                      {formatMoney(customer.revenueCents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
