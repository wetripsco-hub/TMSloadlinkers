-- =====================================================================
-- 032_financial_report_functions.sql
--
-- Net-new reporting functions, parameterized by a caller-supplied date
-- range instead of the fixed periods hardcoded into the existing
-- dashboard views (v_kpi_summary: current calendar month; v_revenue_by_week:
-- rolling 12 weeks; v_top_customers: current calendar month). Those views
-- are NOT modified or dropped here -- the overview dashboard still reads
-- them as-is. These functions are an additive path for a future reports
-- feature that needs an arbitrary [p_start_date, p_end_date] window.
--
-- needs_shipper_rate guard: a load created via createLoadFromDocument has
-- shipper_rate = 0 (not a real $0 rate -- see 027_needs_shipper_rate.sql)
-- until completeShipperRate/createLoadFromRateConReview finishes it, so it
-- would silently deflate any revenue/margin aggregate. 028 and 029 already
-- exclude needs_shipper_rate = true loads from v_kpi_summary's revenue_mtd
-- and v_revenue_by_week's weekly_loads; get_financial_report_summary and
-- get_revenue_by_period apply the same guard to their revenue/margin
-- aggregates for the same reason. get_top_customers_report intentionally
-- mirrors v_top_customers' current logic as-is (that view has never had
-- the guard applied), so it is left unguarded here too -- adding it would
-- be a behavior change beyond "parameterize the date range."
--
-- Org scoping: every function takes p_org_id and filters on it explicitly
-- in addition to relying on RLS (all are SECURITY INVOKER, so the caller's
-- own org-scoped RLS policies on loads/customers apply regardless). This
-- is not a cross-tenant admin read, so none of these are SECURITY DEFINER.
--
-- Date basis: pickup_date is timestamptz; callers pass plain `date` bounds,
-- so every comparison casts pickup_date::date, matching how 014's views
-- already bucket on pickup_date as each load's activity date.
-- =====================================================================

begin;

-- ============================================================================
-- 1. get_financial_report_summary -- totals for an arbitrary date range
-- ============================================================================

create or replace function get_financial_report_summary(
  p_org_id uuid,
  p_start_date date,
  p_end_date date
)
returns table (
  total_revenue numeric,
  total_margin numeric,
  total_loads bigint,
  delivered_loads bigint
)
language sql
security invoker
stable
set search_path = public, pg_temp
as $$
  select
    coalesce(sum(loads.shipper_rate), 0) as total_revenue,
    coalesce(sum(loads.broker_margin), 0) as total_margin,
    count(*) as total_loads,
    count(*) filter (
      where loads.status in ('delivered', 'pod_uploaded', 'invoiced', 'settled')
    ) as delivered_loads
  from loads
  where loads.org_id = p_org_id
    and loads.status <> 'cancelled'
    and loads.needs_shipper_rate = false
    and loads.pickup_date::date between p_start_date and p_end_date;
$$;

comment on function get_financial_report_summary(uuid, date, date) is
  'Date-range-parameterized equivalent of v_kpi_summary''s revenue/margin/delivered figures. Excludes cancelled loads and needs_shipper_rate = true (incomplete OCR-created) loads, same as 028.';

-- ============================================================================
-- 2. get_revenue_by_period -- zero-filled series over an arbitrary range,
--    bucketed by week or month
-- ============================================================================

create or replace function get_revenue_by_period(
  p_org_id uuid,
  p_start_date date,
  p_end_date date,
  p_bucket text default 'week'
)
returns table (
  bucket_start date,
  revenue numeric,
  cost numeric,
  margin numeric
)
language plpgsql
security invoker
stable
set search_path = public, pg_temp
as $$
declare
  v_step interval;
begin
  if p_bucket not in ('week', 'month') then
    raise exception 'get_revenue_by_period: p_bucket must be ''week'' or ''month'' (got %)', p_bucket;
  end if;

  v_step := case p_bucket when 'week' then interval '1 week' else interval '1 month' end;

  return query
  with bucket_spine as (
    select generate_series(
      date_trunc(p_bucket, p_start_date::timestamp),
      date_trunc(p_bucket, p_end_date::timestamp),
      v_step
    )::date as bucket_start
  ),
  bucketed_loads as (
    select
      date_trunc(p_bucket, loads.pickup_date)::date as bucket_start,
      sum(loads.shipper_rate) as revenue,
      sum(loads.carrier_pay) as cost,
      sum(loads.broker_margin) as margin
    from loads
    where loads.org_id = p_org_id
      and loads.status <> 'cancelled'
      and loads.needs_shipper_rate = false
      and loads.pickup_date::date between p_start_date and p_end_date
    group by 1
  )
  select
    bucket_spine.bucket_start,
    coalesce(bucketed_loads.revenue, 0) as revenue,
    coalesce(bucketed_loads.cost, 0) as cost,
    coalesce(bucketed_loads.margin, 0) as margin
  from bucket_spine
  left join bucketed_loads using (bucket_start)
  order by bucket_spine.bucket_start;
end;
$$;

comment on function get_revenue_by_period(uuid, date, date, text) is
  'Date-range-parameterized equivalent of v_revenue_by_week, bucketed by week or month (p_bucket) instead of a fixed rolling-12-week window. Zero-fills empty buckets via generate_series, same as 014/029. Excludes cancelled and needs_shipper_rate = true loads.';

-- ============================================================================
-- 3. get_top_customers_report -- top N customers by revenue over an
--    arbitrary date range
-- ============================================================================

create or replace function get_top_customers_report(
  p_org_id uuid,
  p_start_date date,
  p_end_date date,
  p_limit int default 5
)
returns table (
  customer_id uuid,
  company_name text,
  revenue numeric,
  load_count bigint
)
language sql
security invoker
stable
set search_path = public, pg_temp
as $$
  select
    customers.id as customer_id,
    customers.name as company_name,
    sum(loads.shipper_rate) as revenue,
    count(loads.id) as load_count
  from loads
  join customers on customers.id = loads.customer_id
  where loads.org_id = p_org_id
    and loads.status <> 'cancelled'
    and loads.pickup_date::date between p_start_date and p_end_date
  group by customers.id, customers.name
  order by revenue desc
  limit p_limit;
$$;

comment on function get_top_customers_report(uuid, date, date, int) is
  'Date-range-parameterized equivalent of v_top_customers, limit configurable via p_limit (default 5, matching the view). Mirrors the view''s current logic exactly, including the absence of the needs_shipper_rate guard -- see the file header note.';

commit;
