-- 022_platform_views.sql
-- Read-only cross-tenant organization roster for the platform-admin
-- surface (021_platform_admin.sql). get_platform_organizations() is the
-- only sanctioned way to read across every tenant's organizations row:
-- it is SECURITY DEFINER (bypassing the per-org organizations_select_own_org
-- policy), so it self-checks is_platform_admin(auth.uid()) and raises
-- rather than silently returning nothing for a non-admin caller -- a
-- caller who is not a platform admin should see a clear authorization
-- error, not an empty table that looks like "there are no organizations".
--
-- Deliberately organization metadata only: no loads, invoices, carriers,
-- or any other tenant operational data is joined in here.

begin;

create or replace function public.get_platform_organizations()
returns table (
  org_id uuid,
  name text,
  workspace_type text,
  plan_tier text,
  subscription_state text,
  seat_count integer,
  trial_ends_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'Only platform admins may call get_platform_organizations()';
  end if;

  return query
    select
      o.id as org_id,
      o.name,
      o.workspace_type::text,
      s.plan::text as plan_tier,
      s.state::text as subscription_state,
      seats_used(o.id) as seat_count,
      s.trial_ends_at,
      o.created_at
    from organizations o
    left join subscriptions s on s.org_id = o.id
    order by o.created_at desc;
end;
$$;

revoke all on function public.get_platform_organizations() from public;
grant execute on function public.get_platform_organizations() to authenticated;

commit;
