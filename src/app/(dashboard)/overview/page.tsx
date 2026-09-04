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
                icon={<CircleDollarSign className="h-6 w-6 text-emerald-500" />}
                badgeText={`${kpi.marginPercent.toFixed(1)}%`}
                badgeColor="success"
                subtitle="Broker margin this month"
              />
            </Link>

            <Link href="/loads?status=OPEN" className="block">
              <MetricCard
                title="Active Loads"
                value={kpi.activeLoads}
                icon={<Package className="h-6 w-6 text-brand-500" />}
                badgeText="In Pipeline"
                badgeColor="primary"
                subtitle="Not cancelled or settled"
              />
            </Link>

            <Link href="/loads?status=invoiced" className="block">
              <MetricCard
                title="Outstanding AR"
                value={formatCents(kpi.outstandingArCents)}
                icon={<Receipt className="h-6 w-6 text-amber-500" />}
                badgeText={kpi.outstandingArCents > 0 ? "Unpaid" : "Clear"}
                badgeColor={kpi.outstandingArCents > 0 ? "warning" : "light"}
                subtitle="Shipper invoices not yet paid"
              />
            </Link>

            <Link href="/loads?status=in_transit" className="block">
              <MetricCard
                title="In-Transit"
                value={kpi.inTransit}
                icon={<Truck className="h-6 w-6 text-sky-500" />}
                badgeText="On Highway"
                badgeColor="info"
                subtitle="GPS tracking & rolling"
              />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900/60 md:p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Revenue vs. Margin
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">Last 12 weeks</span>
              </div>
              <div className="mt-4">
                <RevenueMarginChart data={revenueByWeek} />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900/60 md:p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Loads by Status
              </h3>
              <div className="mt-4">
                <LoadsStatusDonut data={loadsByStatus} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900/60 md:p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top Customers</h3>
            {topCustomers.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                No revenue booked this month yet.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
                {topCustomers.map((customer, index) => (
                  <li key={customer.customerId} className="flex items-center gap-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {index + 1}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
                      {customer.companyName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {customer.loadCount} load{customer.loadCount === 1 ? "" : "s"}
                    </span>
                    <span className="w-24 text-right text-sm font-semibold text-gray-900 dark:text-white">
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
