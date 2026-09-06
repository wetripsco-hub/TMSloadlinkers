import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  summarizeCarrierPerformance,
  validateReportDateRange,
  type CarrierPerformanceRow,
  type SummarizedCarrierPerformanceRow,
} from "@/lib/domain/reports";
import type { UUID } from "../../../types/domain";

export type ReportBucket = "week" | "month";

export interface FinancialReportSummary {
  totalRevenue: number;
  totalMargin: number;
  totalLoads: number;
  deliveredLoads: number;
}

export type FinancialReportSummaryResult =
  | { valid: true; data: FinancialReportSummary }
  | { valid: false; error: string };

export interface RevenueByPeriodPoint {
  bucketStart: string;
  revenue: number;
  cost: number;
  margin: number;
}

export type RevenueByPeriodResult =
  | { valid: true; data: RevenueByPeriodPoint[] }
  | { valid: false; error: string };

export interface TopCustomerReportRow {
  customerId: UUID;
  companyName: string;
  revenue: number;
  loadCount: number;
}

export type TopCustomersReportResult =
  | { valid: true; data: TopCustomerReportRow[] }
  | { valid: false; error: string };

export interface OnTimeDeliveryPct {
  onTimeCount: number;
  totalEligibleCount: number;
  onTimePct: number | null;
  excludedNoAuditTrailCount: number;
}

export type OnTimeDeliveryPctResult =
  | { valid: true; data: OnTimeDeliveryPct }
  | { valid: false; error: string };

export type CarrierPerformanceReportResult =
  | { valid: true; data: SummarizedCarrierPerformanceRow[] }
  | { valid: false; error: string };

export interface LoadVolumePoint {
  bucketStart: string;
  loadCount: number;
}

export type LoadVolumeByPeriodResult =
  | { valid: true; data: LoadVolumePoint[] }
  | { valid: false; error: string };

// Every RPC below (from migrations 032/033/034) takes p_org_id as an
// explicit argument rather than resolving it from RLS/auth.uid() alone --
// a deviation from most of this codebase's tables, where org_id is never
// passed and RLS alone scopes every query. This mirrors the codebase's own
// precedent for that exact situation (seats_used(p_org_id) in
// lib/repositories/team.ts and subscription.ts): the repository resolves
// org_id server-side via this same getCurrentOrgId helper (duplicated in
// loads.ts/carriers.ts/documents.ts/invoices.ts/customers.ts) and passes it
// in, so no exported function here accepts org_id as a caller-supplied
// parameter -- the "never accept org_id as a parameter" contract holds at
// this repository's own public boundary.
async function getCurrentOrgId(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<UUID> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (error || !data?.org_id) {
    throw new Error("Could not resolve organization for the current user");
  }

  return data.org_id;
}

export async function getFinancialReportSummary(
  startDate: string,
  endDate: string
): Promise<FinancialReportSummaryResult> {
  const validation = validateReportDateRange(startDate, endDate);
  if (!validation.valid) {
    return { valid: false, error: validation.error ?? "Invalid date range" };
  }

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);

  const { data, error } = await supabase
    .rpc("get_financial_report_summary", {
      p_org_id: orgId,
      p_start_date: startDate,
      p_end_date: endDate,
    })
    .single();

  if (error) {
    throw error;
  }

  return {
    valid: true,
    data: {
      totalRevenue: data.total_revenue,
      totalMargin: data.total_margin,
      totalLoads: data.total_loads,
      deliveredLoads: data.delivered_loads,
    },
  };
}

export async function getRevenueByPeriod(
  startDate: string,
  endDate: string,
  bucket: ReportBucket = "week"
): Promise<RevenueByPeriodResult> {
  const validation = validateReportDateRange(startDate, endDate);
  if (!validation.valid) {
    return { valid: false, error: validation.error ?? "Invalid date range" };
  }

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);

  const { data, error } = await supabase.rpc("get_revenue_by_period", {
    p_org_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_bucket: bucket,
  });

  if (error) {
    throw error;
  }

  return {
    valid: true,
    data: (data ?? []).map((row) => ({
      bucketStart: row.bucket_start,
      revenue: row.revenue,
      cost: row.cost,
      margin: row.margin,
    })),
  };
}

export async function getTopCustomersReport(
  startDate: string,
  endDate: string,
  limit = 5
): Promise<TopCustomersReportResult> {
  const validation = validateReportDateRange(startDate, endDate);
  if (!validation.valid) {
    return { valid: false, error: validation.error ?? "Invalid date range" };
  }

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);

  const { data, error } = await supabase.rpc("get_top_customers_report", {
    p_org_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_limit: limit,
  });

  if (error) {
    throw error;
  }

  return {
    valid: true,
    data: (data ?? []).map((row) => ({
      customerId: row.customer_id,
      companyName: row.company_name,
      revenue: row.revenue,
      loadCount: row.load_count,
    })),
  };
}

export async function getOnTimeDeliveryPct(
  startDate: string,
  endDate: string
): Promise<OnTimeDeliveryPctResult> {
  const validation = validateReportDateRange(startDate, endDate);
  if (!validation.valid) {
    return { valid: false, error: validation.error ?? "Invalid date range" };
  }

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);

  const { data, error } = await supabase
    .rpc("get_on_time_delivery_pct", {
      p_org_id: orgId,
      p_start_date: startDate,
      p_end_date: endDate,
    })
    .single();

  if (error) {
    throw error;
  }

  return {
    valid: true,
    data: {
      onTimeCount: data.on_time_count,
      totalEligibleCount: data.total_eligible_count,
      onTimePct: data.on_time_pct,
      excludedNoAuditTrailCount: data.excluded_no_audit_trail_count,
    },
  };
}

export async function getCarrierPerformanceReport(
  startDate: string,
  endDate: string
): Promise<CarrierPerformanceReportResult> {
  const validation = validateReportDateRange(startDate, endDate);
  if (!validation.valid) {
    return { valid: false, error: validation.error ?? "Invalid date range" };
  }

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);

  const { data, error } = await supabase.rpc("get_carrier_performance_report", {
    p_org_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    throw error;
  }

  const rows: CarrierPerformanceRow[] = (data ?? []).map((row) => ({
    carrierId: row.carrier_id,
    carrierName: row.carrier_name,
    totalLoads: row.total_loads,
    deliveredLoads: row.delivered_loads,
    onTimeCount: row.on_time_count,
    totalEligibleCount: row.total_eligible_count,
    onTimePct: row.on_time_pct,
    excludedNoAuditTrailCount: row.excluded_no_audit_trail_count,
    totalCarrierPay: row.total_carrier_pay,
  }));

  return { valid: true, data: summarizeCarrierPerformance(rows) };
}

export async function getLoadVolumeByPeriod(
  startDate: string,
  endDate: string,
  bucket: ReportBucket = "week"
): Promise<LoadVolumeByPeriodResult> {
  const validation = validateReportDateRange(startDate, endDate);
  if (!validation.valid) {
    return { valid: false, error: validation.error ?? "Invalid date range" };
  }

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);

  const { data, error } = await supabase.rpc("get_load_volume_by_period", {
    p_org_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_bucket: bucket,
  });

  if (error) {
    throw error;
  }

  return {
    valid: true,
    data: (data ?? []).map((row) => ({
      bucketStart: row.bucket_start,
      loadCount: row.load_count,
    })),
  };
}
