import { Clock, AlertTriangle } from "lucide-react";

import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import { formatOnTimePct, type SummarizedCarrierPerformanceRow } from "@/lib/domain/reports";
import { LoadVolumeChart } from "@/components/reports/load-volume-chart";
import { ExportButtons } from "@/components/reports/export-buttons";
import type { OnTimeDeliveryPct, LoadVolumePoint, ReportBucket } from "@/lib/repositories/reports";

function formatDollars(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export interface OperationalTabProps {
  onTimeDelivery: OnTimeDeliveryPct;
  carrierPerformance: SummarizedCarrierPerformanceRow[];
  loadVolume: LoadVolumePoint[];
  startDate: string;
  endDate: string;
  bucket: ReportBucket;
}

export function OperationalTab({
  onTimeDelivery,
  carrierPerformance,
  loadVolume,
  startDate,
  endDate,
  bucket,
}: OperationalTabProps) {
  const onTimeDisplay = formatOnTimePct(
    onTimeDelivery.onTimePct,
    onTimeDelivery.excludedNoAuditTrailCount,
    onTimeDelivery.totalEligibleCount
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="On-Time Delivery"
          value={onTimeDisplay.text}
          icon={<Clock className="h-5 w-5 text-blue-600" />}
          subtitle={onTimeDisplay.hint}
          variant="plausible"
        />
        <MetricCard
          title="On-Time Loads"
          value={onTimeDelivery.onTimeCount}
          icon={<Clock className="h-5 w-5 text-emerald-600" />}
          subtitle={`Of ${onTimeDelivery.totalEligibleCount} eligible loads`}
          variant="plausible"
        />
        <MetricCard
          title="Excluded (No Audit Trail)"
          value={onTimeDelivery.excludedNoAuditTrailCount}
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          subtitle="Not counted as on-time or late"
          variant="plausible"
        />
      </div>

      <div className="rounded-md border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="text-sm font-semibold text-slate-900">Carrier Performance</h4>
          <ExportButtons reportType="carrier-performance" startDate={startDate} endDate={endDate} />
        </div>
        {carrierPerformance.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No data for this period</p>
        ) : (
          <table className="mt-4 min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-2">Carrier</th>
                <th className="py-2 text-right">Total Loads</th>
                <th className="py-2 text-right">Delivered</th>
                <th className="py-2 text-right">On-Time %</th>
                <th className="py-2 text-right">Total Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {carrierPerformance.map((row) => {
                const rowOnTime = formatOnTimePct(
                  row.onTimePct,
                  row.excludedNoAuditTrailCount,
                  row.totalEligibleCount
                );

                return (
                  <tr key={row.carrierId}>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{row.carrierName}</span>
                        {row.needsAttention && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                            <AlertTriangle className="size-3" />
                            Needs Attention
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-slate-500">{row.totalLoads}</td>
                    <td className="py-2.5 text-right text-slate-500">{row.deliveredLoads}</td>
                    <td className="py-2.5 text-right text-slate-700" title={rowOnTime.hint}>
                      {rowOnTime.text}
                    </td>
                    <td className="py-2.5 text-right text-slate-700">{formatDollars(row.totalCarrierPay)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-md border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="text-sm font-semibold text-slate-900">Load Volume</h4>
          <ExportButtons
            reportType="load-volume"
            startDate={startDate}
            endDate={endDate}
            bucket={bucket}
          />
        </div>
        <div className="mt-4">
          <LoadVolumeChart data={loadVolume} bucket={bucket} />
        </div>
      </div>
    </div>
  );
}
