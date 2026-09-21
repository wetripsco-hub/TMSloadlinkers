-- 049_carrier_compliance_columns.sql
-- Manually-entered carrier compliance data (insurance, blacklist status,
-- COI upload) -- distinct from the 5 FMCSA-derived columns added in
-- 047_carrier_verification_columns.sql, which stay untouched here.
-- numeric(12,2) dollar amounts, matching loads.shipper_rate's convention
-- (not integer cents).

alter table carriers
  add column insurance_carrier_name text,
  add column insurance_policy_number text,
  add column insurance_expiry_date date,
  add column cargo_coverage_limit numeric(12, 2),
  add column auto_liability_limit numeric(12, 2),
  add column is_blacklisted boolean not null default false,
  add column blacklist_reason text,
  add column coi_file_url text;

-- Private bucket for carrier compliance documents (COI, etc). Objects keyed
-- as `${org_id}/${carrier_id}/${filename}`, same folder-scoping shape as
-- load-documents (008_load_documents_storage.sql), but using
-- get_auth_user_org_id() -- the SECURITY DEFINER helper established in
-- 011_fix_rls_recursion.sql and used by every migration since -- instead of
-- inlining the profiles subquery the way 008 (which predates that fix)
-- still does.
insert into storage.buckets (id, name, public)
values ('carrier-documents', 'carrier-documents', false)
on conflict (id) do nothing;

create policy "carrier_documents_storage_select_own_org"
  on storage.objects for select
  using (
    bucket_id = 'carrier-documents'
    and (storage.foldername(name))[1] = get_auth_user_org_id()::text
  );

create policy "carrier_documents_storage_insert_own_org"
  on storage.objects for insert
  with check (
    bucket_id = 'carrier-documents'
    and (storage.foldername(name))[1] = get_auth_user_org_id()::text
  );

create policy "carrier_documents_storage_delete_own_org"
  on storage.objects for delete
  using (
    bucket_id = 'carrier-documents'
    and (storage.foldername(name))[1] = get_auth_user_org_id()::text
  );
