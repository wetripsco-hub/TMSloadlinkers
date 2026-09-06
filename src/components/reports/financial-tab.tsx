"use client";

import { CircleDollarSign, Package, TrendingUp, CheckCircle2, Info } from "lucide-react";

import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import { useWorkspaceMode } from "@/hooks/use-workspace-mode";
import { RevenueByPeriodChart } from "@/components/reports/revenue-by-period-chart";
import { BucketToggle } from "@/components/reports/bucket-toggle";
import { ExportButtons } from "@/components/reports/export-buttons";
import type {
  FinancialReportSummary,
  RevenueByPeriodPoint,
  TopCustomerReportRow,
  ReportBucket,
} from "@/lib/repositories/reports";

function formatDollars(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export interface FinancialTabProps {
  summary: FinancialReportSummary;
  revenueByPeriod: RevenueByPeriodPoint[];
  topCustomers: TopCustomerReportRow[];
  startDate: string;
  endDate: string;
  bucket: ReportBucket;
}

export function FinancialTab({
  summary,
  revenueByPeriod,
  topCustomers,
  startDate,
  endDate,
  bucket,
}: FinancialTabProps) {
  const { isDispatcher, isLoading } = useWorkspaceMode();

  // get_financial_report_summary (032) only tracks broker_margin -- there is
  // no separate dispatcher-commission aggregate in this repository/function,
  // and this task cannot add one (lib/repositories/reports.ts is off-limits
  // here). So the workspace-mode toggle changes label/subtitle copy only,
  // never the underlying number, and says so rather than implying a real
  // commission figure exists.
  const marginLabel = !isLoading && isDispatcher ? "Margin (as Commission Basis)" : "Gross Margin";
  const marginSubtitle =
    !isLoading && isDispatcher
      ? "Broker-margin figure -- dispatcher commission isn't tracked separately yet"
      : "Shipper rate minus carrier pay";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatDollars(summary.totalRevenue)}
          icon={<CircleDollarSign className="h-5 w-5 text-emerald-600" />}
          subtitle="Shipper rate, sum"
          variant="plausible"
        />
        <MetricCard
          title={marginLabel}
          value={formatDollars(summary.totalMargin)}
          icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
          subtitle={marginSubtitle}
          variant="plausible"
        />
        <MetricCard
          title="Total Loads"
          value={summary.totalLoads}
          icon={<Package className="h-5 w-5 text-indigo-600" />}
          subtitle="Picked up in range"
          variant="plausible"
        />
        <MetricCard
          title="Delivered Loads"
          value={summary.deliveredLoads}
          icon={<CheckCircle2 className="h-5 w-5 text-sky-600" />}
          subtitle="Reached delivered or later"
          variant="plausible"
        />
      </div>

      {!isLoading && isDispatcher && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <p>
            This figure uses the broker-margin formula (shipper rate − carrier pay).
            Commission-based reporting (dispatcher_commission_earned) is not yet
            available — tracked as a future task.
          </p>
        </div>
      )}

      <div className="rounded-md border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h4 className="text-sm font-semibold text-slate-900">Revenue by Period</h4>
          <div className="flex items-center gap-2">
            <BucketToggle bucket={bucket} />
            <ExportButtons
              reportType="financial-summary"
              startDate={startDate}
              endDate={endDate}
              bucket={bucket}
            />
          </div>
        </div>
        <div className="mt-4">
          <RevenueByPeriodChart data={revenueByPeriod} bucket={bucket} />
        </div>
      </div>

      <div className="rounded-md border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="text-sm font-semibold text-slate-900">Top Customers</h4>
          <ExportButtons reportType="top-customers" startDate={startDate} endDate={endDate} />
        </div>
        {topCustomers.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No data for this period</p>
        ) : (
          <table className="mt-4 min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-2">Customer</th>
                <th className="py-2 text-right">Revenue</th>
                <th className="py-2 text-right">Loads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topCustomers.map((row) => (
                <tr key={row.customerId}>
                  <td className="py-2.5 font-medium text-slate-900">{row.companyName}</td>
                  <td className="py-2.5 text-right text-slate-700">{formatDollars(row.revenue)}</td>
                  <td className="py-2.5 text-right text-slate-500">{row.loadCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
