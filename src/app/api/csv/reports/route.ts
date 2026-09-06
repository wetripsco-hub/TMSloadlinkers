import type { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  getFinancialReportSummary,
  getCarrierPerformanceReport,
  getLoadVolumeByPeriod,
  getTopCustomersReport,
  type ReportBucket,
} from "@/lib/repositories/reports";
import { formatOnTimePct, bucketLabelFormatter } from "@/lib/domain/reports";
import { toCsv } from "@/lib/reports/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReportType = "financial-summary" | "carrier-performance" | "load-volume" | "top-customers";

const REPORT_TYPES: ReportType[] = [
  "financial-summary",
  "carrier-performance",
  "load-volume",
  "top-customers",
];

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function isAuthenticated(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}

export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams;
  const reportType = searchParams.get("reportType") as ReportType | null;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const bucket = (searchParams.get("bucket") ?? "week") as ReportBucket;

  if (!reportType || !REPORT_TYPES.includes(reportType)) {
    return jsonError(
      `reportType must be one of: ${REPORT_TYPES.join(", ")}`,
      400
    );
  }
  if (!startDate || !endDate) {
    return jsonError("startDate and endDate are required", 400);
  }
  if (bucket !== "week" && bucket !== "month") {
    return jsonError("bucket must be 'week' or 'month'", 400);
  }

  if (!(await isAuthenticated())) {
    return jsonError("Not authenticated", 401);
  }

  let headers: string[];
  let rows: (string | number | null)[][];

  if (reportType === "financial-summary") {
    const result = await getFinancialReportSummary(startDate, endDate);
    if (!result.valid) {
      return jsonError(result.error, 400);
    }
    headers = ["Metric", "Value"];
    rows = [
      ["Total Revenue", result.data.totalRevenue],
      ["Total Margin", result.data.totalMargin],
      ["Total Loads", result.data.totalLoads],
      ["Delivered Loads", result.data.deliveredLoads],
    ];
  } else if (reportType === "carrier-performance") {
    const result = await getCarrierPerformanceReport(startDate, endDate);
    if (!result.valid) {
      return jsonError(result.error, 400);
    }
    headers = ["Carrier", "Total Loads", "Delivered", "On-Time %", "Total Pay"];
    rows = result.data.map((row) => [
      row.carrierName,
      row.totalLoads,
      row.deliveredLoads,
      formatOnTimePct(row.onTimePct, row.excludedNoAuditTrailCount, row.totalEligibleCount).text,
      row.totalCarrierPay,
    ]);
  } else if (reportType === "load-volume") {
    const result = await getLoadVolumeByPeriod(startDate, endDate, bucket);
    if (!result.valid) {
      return jsonError(result.error, 400);
    }
    headers = ["Period", "Load Count"];
    rows = result.data.map((point) => [
      bucketLabelFormatter(point.bucketStart, bucket),
      point.loadCount,
    ]);
  } else {
    const result = await getTopCustomersReport(startDate, endDate);
    if (!result.valid) {
      return jsonError(result.error, 400);
    }
    headers = ["Customer", "Revenue", "Load Count"];
    rows = result.data.map((row) => [row.companyName, row.revenue, row.loadCount]);
  }

  const csv = toCsv(headers, rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${reportType}_${startDate}_${endDate}.csv"`,
    },
  });
}
