-- 025_platform_admin_cross_org_reads.sql
-- Fixes a real gap found while building the reset-requests admin page:
-- organizations and profiles only ever had tenant-scoped SELECT policies
-- (id/org_id = get_auth_user_org_id()). A platform admin has no org_id at
-- all, so get_auth_user_org_id() returns null for them and that policy
-- never matches -- any page joining support_tickets or data_reset_requests
-- to organizations(name), or looking up a requester's profiles.email, was
-- silently getting nulls back under real RLS for a platform admin session
-- (this was missed earlier because verification used execute_sql, which
-- runs with elevated privileges that bypass RLS entirely).
--
-- Purely additive: these are extra PERMISSIVE policies (OR'd with the
-- existing ones), so no tenant-facing policy is touched or narrowed.

begin;

create policy "organizations_select_platform_admin"
  on organizations for select
  using (public.is_platform_admin(auth.uid()));

create policy "profiles_select_platform_admin"
  on profiles for select
  using (public.is_platform_admin(auth.uid()));

commit;
