-- 057_kpi_expiring_insurance.sql
-- Adds expiring_insurance_count to v_kpi_summary (014_dashboard_views.sql):
-- carriers with insurance expiring within 30 days, not already expired,
-- not blacklisted. Deliberately excludes already-blacklisted carriers --
-- those are a "blocked" concern (compliance-badge.tsx), not a renewal-due
-- one, so this stays a distinct count from v_exceptions'
-- expired_insurance_count (055_v_exceptions_expired_insurance.sql, which
-- has no blacklist exclusion since a lapsed policy matters regardless of
-- blacklist status).
--
-- Same security_invoker=true / RLS-implicit org scoping as every other
-- CTE and dashboard view; the rest of the view (revenue_mtd, counts,
-- exceptions, ar) is reproduced unchanged from its current deployed form
-- (014_dashboard_views.sql plus 028_exclude_incomplete_loads_from_kpis.sql's
-- needs_shipper_rate filter) since create or replace view must restate the
-- whole query.

create or replace view v_kpi_summary
with (security_invoker = true)
as
with revenue_mtd as (
  select
    coalesce(sum(shipper_rate), 0) as revenue,
    coalesce(sum(broker_margin), 0) as margin
  from loads
  where status <> 'cancelled'
    and needs_shipper_rate = false
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
),
carrier_insurance as (
  select count(*) as expiring_insurance_count
  from carriers
  where is_blacklisted = false
    and insurance_expiry_date is not null
    and insurance_expiry_date >= current_date
    and insurance_expiry_date <= current_date + 30
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
  ar.outstanding_ar,
  carrier_insurance.expiring_insurance_count
from counts, revenue_mtd, exceptions, ar, carrier_insurance;
