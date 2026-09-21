-- 058_exceptions_expiring_insurance.sql
-- Adds expiring_insurance_count to v_exceptions (046_exceptions_view.sql,
-- 055_v_exceptions_expired_insurance.sql), alongside missing_carrier_count
-- and pending_pod_count. Same predicate as v_kpi_summary's
-- expiring_insurance_count (057_kpi_expiring_insurance.sql): carriers with
-- insurance expiring within 30 days, not already expired, not blacklisted
-- -- kept as its own CTE here (rather than joining v_kpi_summary) since
-- every other v_exceptions column is likewise self-contained, and the two
-- views are deliberately allowed to duplicate a predicate rather than
-- depend on each other.
--
-- Distinct from expired_insurance_count (055): that CTE has no blacklist
-- exclusion and only counts already-lapsed policies (< CURRENT_DATE) --
-- this one is the softer "renewal coming due" signal, not "already
-- lapsed", so a blacklisted carrier's lapsed insurance is never
-- double-counted as also "expiring soon".
--
-- security_invoker=true, same RLS-implicit org scoping as the rest of the
-- view (and the fix in 056_exceptions_security_invoker.sql).

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
),
expiring_insurance as (
  select count(*) as expiring_insurance_count
  from carriers
  where carriers.is_blacklisted = false
    and carriers.insurance_expiry_date is not null
    and carriers.insurance_expiry_date >= current_date
    and carriers.insurance_expiry_date <= (current_date + 30)
)
select
  missing_carrier.missing_carrier_count,
  pending_pod.pending_pod_count,
  expired_insurance.expired_insurance_count,
  expiring_insurance.expiring_insurance_count
from missing_carrier, pending_pod, expired_insurance, expiring_insurance;
