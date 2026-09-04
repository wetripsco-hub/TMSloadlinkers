-- 014_dashboard_views.sql
-- Overview dashboard views (P6-T5 style).
--
-- Scoping: every view below is declared `with (security_invoker = true)`.
-- Postgres 17.6 is confirmed on this project (mcp supabase list_projects),
-- and security_invoker views have been supported since Postgres 15, so the
-- querying user's own RLS policies on loads/invoices/customers/carriers
-- apply exactly as they do to a direct table query -- no policy logic is
-- duplicated here, and none of these views is SECURITY DEFINER.
--
-- v_carrier_compliance_summary is deferred, not included here -- see the
-- note at the bottom of this file for why.
--
-- Date basis: pickup_date is used as each load's "activity month/week"
-- throughout (v_kpi_summary's MTD figures, v_revenue_by_week, and
-- v_top_customers), since it is populated earlier in a load's lifecycle
-- than delivery_date and both views need one consistent date to bucket on.
-- delivered_mtd is the one exception: it counts loads delivered this month,
-- so it buckets on delivery_date instead, by definition.
--
-- Money: loads/invoices columns are numeric(12,2). All aggregates below
-- stay numeric end to end; the only rounding is the final round() on each
-- margin_percent column.

-- ============================================================================
-- 1. v_kpi_summary — one row of top-line KPIs for the current org
-- ============================================================================

create view v_kpi_summary
with (security_invoker = true)
as
with revenue_mtd as (
  select
    coalesce(sum(shipper_rate), 0) as revenue,
    coalesce(sum(broker_margin), 0) as margin
  from loads
  where status <> 'cancelled'
    and date_trunc('month', pickup_date) = date_trunc('month', now())
),
counts as (
  select
    count(*) filter (where status not in ('cancelled', 'settled')) as active_loads,
    count(*) filter (where status = 'in_transit') as in_transit,
    count(*) filter (
      where carrier_id is null and status not in ('cancelled', 'settled')
    ) as needs_carrier,
    count(*) filter (
      where status in ('delivered', 'pod_uploaded', 'invoiced', 'settled')
        and date_trunc('month', delivery_date) = date_trunc('month', now())
    ) as delivered_mtd
  from loads
),
-- exceptionNoted is the only exception-style signal that exists anywhere in
-- the schema: it is a POD OCR field (types/domain.ts PodExtraction),
-- persisted as JSONB on load_documents.ocr_extracted_json in the shape
-- { value: boolean | null, confidence: number }. There is no loads-level
-- exception/flag column, so this is the faithful source rather than an
-- invented one.
exceptions as (
  select count(*) as exception_count
  from load_documents
  where document_type = 'POD'
    and (ocr_extracted_json -> 'exceptionNoted' ->> 'value')::boolean is true
),
ar as (
  select coalesce(sum(amount_due), 0) as outstanding_ar
  from invoices
  where invoice_type = 'shipper_invoice'
    and payment_status not in ('paid', 'cancelled')
)
select
  counts.active_loads,
  counts.in_transit,
  counts.needs_carrier,
  counts.delivered_mtd,
  exceptions.exception_count,
  revenue_mtd.margin as gross_margin_mtd,
  round(
    case when revenue_mtd.revenue = 0 then 0
    else (revenue_mtd.margin / revenue_mtd.revenue) * 100
    end,
    2
  ) as margin_percent,
  ar.outstanding_ar
from counts, revenue_mtd, exceptions, ar;

-- ============================================================================
-- 2. v_revenue_by_week — last 12 ISO weeks, zero-filled
-- ============================================================================

create view v_revenue_by_week
with (security_invoker = true)
as
with week_spine as (
  select generate_series(
    date_trunc('week', now()) - interval '11 weeks',
    date_trunc('week', now()),
    interval '1 week'
  )::date as week_start
),
weekly_loads as (
  select
    date_trunc('week', pickup_date)::date as week_start,
    sum(shipper_rate) as revenue,
    sum(carrier_pay) as cost,
    sum(broker_margin) as margin
  from loads
  where status <> 'cancelled'
    and pickup_date >= date_trunc('week', now()) - interval '11 weeks'
  group by 1
)
select
  week_spine.week_start,
  coalesce(weekly_loads.revenue, 0) as revenue,
  coalesce(weekly_loads.cost, 0) as cost,
  coalesce(weekly_loads.margin, 0) as margin,
  round(
    case when coalesce(weekly_loads.revenue, 0) = 0 then 0
    else (weekly_loads.margin / weekly_loads.revenue) * 100
    end,
    2
  ) as margin_percent
from week_spine
left join weekly_loads using (week_start)
order by week_spine.week_start;

-- ============================================================================
-- 3. v_loads_by_status — every enum label, including zero-count ones
-- ============================================================================

create view v_loads_by_status
with (security_invoker = true)
as
select
  enum_labels.status,
  count(loads.id) as count
from unnest(enum_range(null::load_operational_status)) as enum_labels(status)
left join loads on loads.status = enum_labels.status
group by enum_labels.status
order by enum_labels.status;

-- ============================================================================
-- 4. v_top_customers — top 5 by revenue MTD
-- ============================================================================

create view v_top_customers
with (security_invoker = true)
as
select
  customers.id as customer_id,
  customers.name as company_name,
  sum(loads.shipper_rate) as revenue,
  count(loads.id) as load_count
from loads
join customers on customers.id = loads.customer_id
where loads.status <> 'cancelled'
  and date_trunc('month', loads.pickup_date) = date_trunc('month', now())
group by customers.id, customers.name
order by revenue desc
limit 5;

-- ============================================================================
-- 5. v_carrier_compliance_summary — DEFERRED
-- ============================================================================
--
-- This view is deferred until the carriers table carries compliance data.
-- Phase 3 was never built: `carriers` (002, the only migration that ever
-- touches it) has just id, org_id, name, mc_number, dot_number,
-- contact_email, contact_phone, created_at, updated_at -- no insurance,
-- authority, or blacklist columns, and no separate carrier_verifications
-- table exists in any migration. deriveComplianceBadge()
-- (src/lib/domain/carrier-compliance.ts) needs isBlacklisted,
-- insuranceExpiryDate, cargoCoverageLimit, autoLiabilityLimit, plus a
-- CarrierVerificationResult (authorityActive, insuranceOnFile,
-- safetyRating, outOfServiceDate), none of which are persisted --
-- carriers.ts hardcodes inert fallbacks for every one of these fields.
--
-- A view can only aggregate what a table stores, so this is not stubbed
-- and does not return an all-unverified placeholder. See CLAUDE.md,
-- "Deferred: carrier compliance", for the unblocking paths.
