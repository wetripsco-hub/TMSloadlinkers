-- 055_v_exceptions_expired_insurance.sql
-- Adds expired_insurance_count to v_exceptions (046_exceptions_view.sql),
-- the third exception count that migration's header comment flagged as
-- deliberately deferred until carriers had compliance columns.
-- 049_carrier_compliance_columns.sql added insurance_expiry_date, so that
-- gap is now closed.
--
-- Deliberately narrower than deriveComplianceBadge's "expiring" badge
-- (lib/domain/carrier-compliance.ts, isInsuranceExpiringSoon: anything
-- <= 30 days out, including future dates) -- this count is only carriers
-- whose insurance has already lapsed (insurance_expiry_date < CURRENT_DATE),
-- matching the exception workbench's "needs attention now" framing rather
-- than the carrier directory's "renew soon" framing. Same
-- security_invoker/RLS-implicit scoping as the other two CTEs.

create or replace view v_exceptions
with (security_invoker = true)
as
with missing_carrier as (
  select count(*) as missing_carrier_count
  from loads
  where status in ('covered', 'dispatched', 'at_pickup', 'in_transit', 'at_delivery')
    and carrier_id is null
),
pending_pod as (
  select count(*) as pending_pod_count
  from loads
  where status = 'delivered'
    and not exists (
      select 1
      from load_documents
      where load_documents.load_id = loads.id
        and load_documents.document_type in ('POD', 'BOL')
        and load_documents.ocr_status = 'completed'
    )
),
expired_insurance as (
  select count(*) as expired_insurance_count
  from carriers
  where carriers.insurance_expiry_date is not null
    and carriers.insurance_expiry_date < current_date
)
select
  missing_carrier.missing_carrier_count,
  pending_pod.pending_pod_count,
  expired_insurance.expired_insurance_count
from missing_carrier, pending_pod, expired_insurance;
