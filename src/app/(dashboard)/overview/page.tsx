import Link from "next/link";
import {
  getCurrentSubscription,
  getKpiSummary,
  getLoadsByStatus,
  getRevenueByWeek,
  getTopCustomers,
} from "@/lib/repositories/dashboard";
import { PageBreadcrumb } from "@/components/common/PageBreadCrumb";
import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { EmptyStateChecklist } from "@/components/dashboard/empty-state-checklist";
import { RevenueMarginChart } from "@/components/dashboard/revenue-margin-chart";
import { LoadsStatusDonut } from "@/components/dashboard/loads-status-donut";
import { formatCents } from "@/lib/money";
import { CircleDollarSign, Package, Receipt, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

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
      <PageBreadcrumb pageTitle="Overview" />

      <TrialBanner subscription={subscription} />

      {totalLoads === 0 ? (
        <EmptyStateChecklist />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/loads" className="block">
              <MetricCard
                title="Gross Margin (MTD)"
                value={formatCents(kpi.grossMarginMtdCents)}
                icon={<CircleDollarSign className="h-5 w-5 text-emerald-600" />}
                badgeText={`${kpi.marginPercent.toFixed(1)}%`}
                badgeColor="success"
                subtitle="Broker margin this month"
                variant="plausible"
              />
            </Link>

            <Link href="/loads?status=OPEN" className="block">
              <MetricCard
                title="Active Loads"
                value={kpi.activeLoads}
                icon={<Package className="h-5 w-5 text-indigo-600" />}
                badgeText="In Pipeline"
                badgeColor="primary"
                subtitle="Not cancelled or settled"
                variant="plausible"
              />
            </Link>

            <Link href="/loads?status=invoiced" className="block">
              <MetricCard
                title="Outstanding AR"
                value={formatCents(kpi.outstandingArCents)}
                icon={<Receipt className="h-5 w-5 text-amber-600" />}
                badgeText={kpi.outstandingArCents > 0 ? "Unpaid" : "Clear"}
                badgeColor={kpi.outstandingArCents > 0 ? "warning" : "light"}
                subtitle="Shipper invoices not yet paid"
                variant="plausible"
              />
            </Link>

            <Link href="/loads?status=in_transit" className="block">
              <MetricCard
                title="In-Transit"
                value={kpi.inTransit}
                icon={<Truck className="h-5 w-5 text-sky-600" />}
                badgeText="On Highway"
                badgeColor="info"
                subtitle="GPS tracking & rolling"
                variant="plausible"
              />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-md border border-slate-200/80 bg-white p-5 shadow-sm md:p-6 lg:col-span-2">
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

            <div className="rounded-md border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
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

          <div className="rounded-md border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">Top Customers</h3>
              <span className="text-xs font-medium text-slate-500">By MTD Revenue</span>
            </div>
            {topCustomers.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No revenue booked this month yet.
              </p>
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
                      {customer.loadCount} load{customer.loadCount === 1 ? "" : "s"}
                    </span>
                    <span className="w-24 text-right text-sm font-semibold text-slate-900">
                      {formatCents(customer.revenueCents)}
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
