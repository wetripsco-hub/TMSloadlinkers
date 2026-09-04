-- 011_fix_rls_recursion.sql
-- Fixes Postgres error 42P17 (infinite recursion detected in policy for
-- relation "profiles") hit during signup/login.
--
-- Root cause: profiles_select_own_org and profiles_update_own_row (both on
-- profiles, from 001_foundation.sql) subquery profiles from within a policy
-- on profiles itself -- `org_id in (select org_id from profiles where ...)`.
-- Evaluating that subquery re-triggers RLS on profiles, which re-evaluates
-- the same policy, recursing. organizations_select_own_org and
-- organizations_update_own_org (also from 001) subquery profiles too; since
-- profiles has RLS enabled, evaluating *those* policies pulls in profiles'
-- own (recursive) policies as well.
--
-- Fix: a SECURITY DEFINER helper resolves the caller's org_id by bypassing
-- RLS entirely (definer functions run as their owner, not the caller), so
-- no policy ever queries profiles from within a policy on profiles again.

create or replace function public.get_auth_user_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from profiles where id = auth.uid() limit 1;
$$;

grant execute on function public.get_auth_user_org_id() to anon, authenticated;

-- ============================================================================
-- profiles: drop the two recursive policies, replace with three clean ones
-- ============================================================================

drop policy "profiles_select_own_org" on profiles;
drop policy "profiles_update_own_row" on profiles;

-- Read own profile row (covers onboarding, where org_id is still null).
create policy "profiles_select_own_row"
  on profiles for select
  using (id = auth.uid());

-- Read colleague profiles in the same org.
create policy "profiles_select_same_org"
  on profiles for select
  using (org_id = public.get_auth_user_org_id());

-- Update only your own row. The with check preserves the original
-- one-time-assignment guarantee (org_id may be set once from null, but not
-- reassigned to a different org afterward) without the recursive subquery.
create policy "profiles_update_own_row"
  on profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and (
      public.get_auth_user_org_id() is null
      or org_id = public.get_auth_user_org_id()
    )
  );

-- ============================================================================
-- organizations: same fix, using the helper instead of a profiles subquery
-- ============================================================================

drop policy "organizations_select_own_org" on organizations;
drop policy "organizations_update_own_org" on organizations;

create policy "organizations_select_own_org"
  on organizations for select
  using (id = public.get_auth_user_org_id());

create policy "organizations_update_own_org"
  on organizations for update
  using (id = public.get_auth_user_org_id())
  with check (id = public.get_auth_user_org_id());
