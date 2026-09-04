import { createClient } from "@/lib/supabase/server";
import { parseCents } from "@/lib/money";
import type { Cents, LoadStatus, UUID } from "../../../types/domain";

function moneyToCents(value: number | null): Cents {
  return parseCents(String(value ?? 0));
}

export interface KpiSummary {
  activeLoads: number;
  inTransit: number;
  needsCarrier: number;
  deliveredMtd: number;
  exceptionCount: number;
  grossMarginMtdCents: Cents;
  marginPercent: number;
  outstandingArCents: Cents;
}

export async function getKpiSummary(): Promise<KpiSummary> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("v_kpi_summary").select("*").maybeSingle();

  if (error) {
    throw error;
  }

  return {
    activeLoads: data?.active_loads ?? 0,
    inTransit: data?.in_transit ?? 0,
    needsCarrier: data?.needs_carrier ?? 0,
    deliveredMtd: data?.delivered_mtd ?? 0,
    exceptionCount: data?.exception_count ?? 0,
    grossMarginMtdCents: moneyToCents(data?.gross_margin_mtd ?? null),
    marginPercent: data?.margin_percent ?? 0,
    outstandingArCents: moneyToCents(data?.outstanding_ar ?? null),
  };
}

export interface RevenueWeek {
  weekStart: string;
  revenueCents: Cents;
  costCents: Cents;
  marginCents: Cents;
  marginPercent: number;
}

export async function getRevenueByWeek(): Promise<RevenueWeek[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("v_revenue_by_week")
    .select("*")
    .order("week_start", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    weekStart: row.week_start ?? "",
    revenueCents: moneyToCents(row.revenue),
    costCents: moneyToCents(row.cost),
    marginCents: moneyToCents(row.margin),
    marginPercent: row.margin_percent ?? 0,
  }));
}

export interface LoadsByStatus {
  status: LoadStatus;
  count: number;
}

export async function getLoadsByStatus(): Promise<LoadsByStatus[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("v_loads_by_status").select("*");

  if (error) {
    throw error;
  }

  return (data ?? [])
    .filter((row): row is { status: LoadStatus; count: number | null } => row.status !== null)
    .map((row) => ({ status: row.status, count: row.count ?? 0 }));
}

export interface TopCustomer {
  customerId: UUID;
  companyName: string;
  revenueCents: Cents;
  loadCount: number;
}

export async function getTopCustomers(): Promise<TopCustomer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("v_top_customers")
    .select("*")
    .order("revenue", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? [])
    .filter((row): row is {
      customer_id: string;
      company_name: string;
      revenue: number | null;
      load_count: number | null;
    } => row.customer_id !== null)
    .map((row) => ({
      customerId: row.customer_id,
      companyName: row.company_name,
      revenueCents: moneyToCents(row.revenue),
      loadCount: row.load_count ?? 0,
    }));
}

export type SubscriptionState = "trialing" | "active" | "past_due" | "canceled" | "expired";

export interface CurrentSubscription {
  state: SubscriptionState;
  trialEndsAt: string;
}

export async function getCurrentSubscription(): Promise<CurrentSubscription | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.org_id) {
    return null;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("state, trial_ends_at")
    .eq("org_id", profile.org_id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  return { state: data.state, trialEndsAt: data.trial_ends_at };
}
