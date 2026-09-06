-- =====================================================================
-- 029_exclude_incomplete_loads_from_revenue_by_week.sql
--
-- Same issue as 028_exclude_incomplete_loads_from_kpis.sql, in
-- v_revenue_by_week's weekly aggregate: a load created via
-- createLoadFromDocument has shipper_rate = 0 until completeShipperRate
-- is called, so it was silently deflating that week's revenue/margin.
-- Excludes needs_shipper_rate = true loads, same as v_kpi_summary now
-- does. Rest of the view definition is unchanged.
-- =====================================================================

begin;

create or replace view v_revenue_by_week
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
    and needs_shipper_rate = false
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

commit;
