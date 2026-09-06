-- 020_org_settings.sql
-- Adds organization profile fields (contact person, logo, address, contact
-- email/phone) and tightens the existing organizations UPDATE policy from
-- "any org member" to "org admin/owner only". Also provisions the public
-- 'org-logos' storage bucket, scoped by org_id path prefix, for logo
-- uploads.
--
-- organizations_update_own_org (011_fix_rls_recursion.sql) currently allows
-- any authenticated member of the org to update the row -- that was fine
-- when the only column was a name nobody guarded, but these new fields are
-- an admin-facing settings surface and must be admin/owner-gated at the
-- database layer, not just hidden in the UI.

begin;

alter table organizations
  add column contact_person_name text,
  add column logo_url text,
  add column address text,
  add column contact_email text,
  add column contact_phone text;

-- SECURITY DEFINER so this can be used inside an organizations policy
-- without re-triggering RLS on profiles (same recursion hazard fixed by
-- get_auth_user_org_id() in 011_fix_rls_recursion.sql).
create or replace function public.is_org_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role in ('owner', 'admin') from profiles where id = auth.uid() limit 1;
$$;

revoke all on function public.is_org_admin() from public;
grant execute on function public.is_org_admin() to authenticated;

drop policy "organizations_update_own_org" on organizations;

create policy "organizations_update_own_org_admin"
  on organizations for update
  using (id = public.get_auth_user_org_id() and public.is_org_admin())
  with check (id = public.get_auth_user_org_id() and public.is_org_admin());

-- ============================================================================
-- Storage: public 'org-logos' bucket, org-scoped writes
-- ============================================================================
-- Public so the sidebar/header can render a logo via a plain public URL
-- without a signed-URL round trip; writes are still locked to the owning
-- org's admins via the folder-prefix + is_org_admin() check below.

insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do nothing;

create policy "org_logos_storage_select_public"
  on storage.objects for select
  using (bucket_id = 'org-logos');

create policy "org_logos_storage_insert_admin_own_org"
  on storage.objects for insert
  with check (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = public.get_auth_user_org_id()::text
    and public.is_org_admin()
  );

create policy "org_logos_storage_update_admin_own_org"
  on storage.objects for update
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = public.get_auth_user_org_id()::text
    and public.is_org_admin()
  );

create policy "org_logos_storage_delete_admin_own_org"
  on storage.objects for delete
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = public.get_auth_user_org_id()::text
    and public.is_org_admin()
  );

commit;
