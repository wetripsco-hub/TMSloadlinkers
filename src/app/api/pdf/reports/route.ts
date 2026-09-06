import { createElement } from "react";
import { Readable } from "node:stream";
import type { NextRequest } from "next/server";
import { renderToStream } from "@react-pdf/renderer";

import { createClient } from "@/lib/supabase/server";
import {
  getFinancialReportSummary,
  getCarrierPerformanceReport,
  getLoadVolumeByPeriod,
  getTopCustomersReport,
  type ReportBucket,
} from "@/lib/repositories/reports";
import { formatOnTimePct, bucketLabelFormatter } from "@/lib/domain/reports";
import {
  ReportDocument,
  type ReportDocumentProps,
} from "@/components/pdf/report-document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReportType = "financial-summary" | "carrier-performance" | "load-volume" | "top-customers";

const REPORT_TITLES: Record<ReportType, string> = {
  "financial-summary": "Financial Summary Report",
  "carrier-performance": "Carrier Performance Report",
  "load-volume": "Load Volume Report",
  "top-customers": "Top Customers Report",
};

function formatDollars(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// No repository/route in this codebase resolves the current org's branding
// without also gating on admin role (getAdminContext), which a report
// export shouldn't require -- any org member should be able to export a
// report they can already view in the dashboard. So this duplicates the
// same auth.uid() -> profiles.org_id lookup every other repository file
// has its own private copy of, then reads name/logo_url directly (no need
// for the fuller OrganizationSettings shape from lib/repositories/organizations.ts).
async function getCurrentOrgBranding(): Promise<{ orgName: string; logoUrl: string | null } | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.org_id) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("name, logo_url")
    .eq("id", profile.org_id)
    .maybeSingle();
  if (!org) return null;

  return { orgName: org.name, logoUrl: org.logo_url };
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams;
  const reportType = searchParams.get("reportType") as ReportType | null;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const bucket = (searchParams.get("bucket") ?? "week") as ReportBucket;

  if (!reportType || !(reportType in REPORT_TITLES)) {
    return jsonError(
      "reportType must be one of: financial-summary, carrier-performance, load-volume, top-customers",
      400
    );
  }
  if (!startDate || !endDate) {
    return jsonError("startDate and endDate are required", 400);
  }
  if (bucket !== "week" && bucket !== "month") {
    return jsonError("bucket must be 'week' or 'month'", 400);
  }

  const branding = await getCurrentOrgBranding();
  if (!branding) {
    return jsonError("Not authenticated", 401);
  }

  const dateRangeLabel = `${startDate} to ${endDate}`;
  let documentProps: ReportDocumentProps;

  if (reportType === "financial-summary") {
    const result = await getFinancialReportSummary(startDate, endDate);
    if (!result.valid) {
      return jsonError(result.error, 400);
    }
    documentProps = {
      title: REPORT_TITLES[reportType],
      branding,
      dateRangeLabel,
      kpiSection: {
        items: [
          { label: "Total Revenue", value: formatDollars(result.data.totalRevenue) },
          { label: "Total Margin", value: formatDollars(result.data.totalMargin) },
          { label: "Total Loads", value: String(result.data.totalLoads) },
          { label: "Delivered Loads", value: String(result.data.deliveredLoads) },
        ],
      },
    };
  } else if (reportType === "carrier-performance") {
    const result = await getCarrierPerformanceReport(startDate, endDate);
    if (!result.valid) {
      return jsonError(result.error, 400);
    }
    documentProps = {
      title: REPORT_TITLES[reportType],
      branding,
      dateRangeLabel,
      tableSection: {
        headers: ["Carrier", "Total Loads", "Delivered", "On-Time %", "Total Pay"],
        rows: result.data.map((row) => [
          row.carrierName,
          String(row.totalLoads),
          String(row.deliveredLoads),
          formatOnTimePct(row.onTimePct, row.excludedNoAuditTrailCount, row.totalEligibleCount).text,
          formatDollars(row.totalCarrierPay),
        ]),
      },
    };
  } else if (reportType === "load-volume") {
    const result = await getLoadVolumeByPeriod(startDate, endDate, bucket);
    if (!result.valid) {
      return jsonError(result.error, 400);
    }
    documentProps = {
      title: REPORT_TITLES[reportType],
      branding,
      dateRangeLabel,
      tableSection: {
        headers: ["Period", "Load Count"],
        rows: result.data.map((point) => [
          bucketLabelFormatter(point.bucketStart, bucket),
          String(point.loadCount),
        ]),
      },
    };
  } else {
    const result = await getTopCustomersReport(startDate, endDate);
    if (!result.valid) {
      return jsonError(result.error, 400);
    }
    documentProps = {
      title: REPORT_TITLES[reportType],
      branding,
      dateRangeLabel,
      tableSection: {
        headers: ["Customer", "Revenue", "Load Count"],
        rows: result.data.map((row) => [
          row.companyName,
          formatDollars(row.revenue),
          String(row.loadCount),
        ]),
      },
    };
  }

  // renderToStream's declared return type is the generic NodeJS.ReadableStream
  // interface, but it always resolves to a concrete Node Readable instance --
  // the cast just recovers that for Readable.toWeb, which needs the class.
  const pdfStream = (await renderToStream(
    createElement(ReportDocument, documentProps)
  )) as unknown as Readable;

  // Report PDFs are regenerated fresh on every request (the date range
  // varies per call, so there is no cache hit rate) -- unlike invoices,
  // nothing here is ever written to Supabase Storage.
  return new Response(Readable.toWeb(pdfStream) as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${reportType}-${startDate}-to-${endDate}.pdf"`,
    },
  });
}
