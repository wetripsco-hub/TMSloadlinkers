-- 046_exceptions_view.sql
-- v_exceptions -- per-org counts of two operational exceptions for the
-- dashboard exception workbench.
--
-- Scoping: same pattern as every other view in 014_dashboard_views.sql --
-- declared `with (security_invoker = true)`, no explicit org_id filter or
-- get_auth_user_org_id() call in the view body. The querying user's own
-- RLS policies on loads/load_documents apply exactly as they do to a
-- direct table query, so org-scoping is implicit via RLS, not duplicated
-- here.
--
-- Only 2 of the 3 originally requested exception counts are here.
-- expired_insurance_count is deliberately omitted: carriers (002) has no
-- insurance_expiry_date or any other compliance column, matching the same
-- gap 014_dashboard_views.sql already documented for
-- v_carrier_compliance_summary. Adding it requires a schema change
-- (carrier compliance columns) that is out of scope for this view.

create view v_exceptions
with (security_invoker = true)
as
with missing_carrier as (
  select count(*) as missing_carrier_count
  from loads
  where status in ('covered', 'dispatched', 'at_pickup', 'in_transit', 'at_delivery')
    and carrier_id is null
),
-- A delivered load's POD/BOL is "pending" until a load_documents row of
-- that type has actually finished OCR review. There is no is_verified
-- column on load_documents (see review-document.ts) -- ocr_status
-- transitioning to 'completed' is the schema's own "reviewed and
-- accepted" signal, so that's what this reuses instead of inventing a
-- verification flag the schema doesn't have.
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
)
select
  missing_carrier.missing_carrier_count,
  pending_pod.pending_pod_count
from missing_carrier, pending_pod;
