-- =====================================================================
-- 028_exclude_incomplete_loads_from_kpis.sql
--
-- A load created via createLoadFromDocument has shipper_rate = 0 (not a
-- real $0 rate -- see 027_needs_shipper_rate.sql) until completeShipperRate
-- is called. v_kpi_summary's revenue_mtd/gross_margin_mtd/margin_percent
-- previously summed shipper_rate unconditionally, so such a load silently
-- deflated MTD revenue and margin the moment it was created. This
-- excludes needs_shipper_rate = true loads from those figures, the same
-- way the view already excludes cancelled loads.
-- =====================================================================

begin;

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

commit;
