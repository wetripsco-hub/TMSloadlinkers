import { format, startOfMonth } from "date-fns";

import { PageBreadcrumb } from "@/components/common/PageBreadCrumb";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ReportsTabs } from "@/components/reports/reports-tabs";
import {
  getFinancialReportSummary,
  getRevenueByPeriod,
  getTopCustomersReport,
  getOnTimeDeliveryPct,
  getCarrierPerformanceReport,
  getLoadVolumeByPeriod,
  type ReportBucket,
} from "@/lib/repositories/reports";

export const dynamic = "force-dynamic";

const DATE_FORMAT = "yyyy-MM-dd";

function defaultDateRange(): { startDate: string; endDate: string } {
  const today = new Date();
  return {
    startDate: format(startOfMonth(today), DATE_FORMAT),
    endDate: format(today, DATE_FORMAT),
  };
}

function InvalidRangeNotice({ error }: { error: string }) {
  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      {error}
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string; bucket?: string }>;
}) {
  const params = await searchParams;
  const defaults = defaultDateRange();
  const startDate = params.startDate ?? defaults.startDate;
  const endDate = params.endDate ?? defaults.endDate;
  const bucket: ReportBucket = params.bucket === "month" ? "month" : "week";

  const [
    financialSummaryResult,
    revenueByPeriodResult,
    topCustomersResult,
    onTimeDeliveryResult,
    carrierPerformanceResult,
    loadVolumeResult,
  ] = await Promise.all([
    getFinancialReportSummary(startDate, endDate),
    getRevenueByPeriod(startDate, endDate, bucket),
    getTopCustomersReport(startDate, endDate),
    getOnTimeDeliveryPct(startDate, endDate),
    getCarrierPerformanceReport(startDate, endDate),
    getLoadVolumeByPeriod(startDate, endDate, bucket),
  ]);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Reports" />

      <DateRangePicker startDate={startDate} endDate={endDate} />

      {!financialSummaryResult.valid ? (
        <InvalidRangeNotice error={financialSummaryResult.error} />
      ) : !revenueByPeriodResult.valid ? (
        <InvalidRangeNotice error={revenueByPeriodResult.error} />
      ) : !topCustomersResult.valid ? (
        <InvalidRangeNotice error={topCustomersResult.error} />
      ) : !onTimeDeliveryResult.valid ? (
        <InvalidRangeNotice error={onTimeDeliveryResult.error} />
      ) : !carrierPerformanceResult.valid ? (
        <InvalidRangeNotice error={carrierPerformanceResult.error} />
      ) : !loadVolumeResult.valid ? (
        <InvalidRangeNotice error={loadVolumeResult.error} />
      ) : (
        <ReportsTabs
          financial={{
            summary: financialSummaryResult.data,
            revenueByPeriod: revenueByPeriodResult.data,
            topCustomers: topCustomersResult.data,
            startDate,
            endDate,
            bucket,
          }}
          operational={{
            onTimeDelivery: onTimeDeliveryResult.data,
            carrierPerformance: carrierPerformanceResult.data,
            loadVolume: loadVolumeResult.data,
            startDate,
            endDate,
            bucket,
          }}
        />
      )}
    </div>
  );
}
