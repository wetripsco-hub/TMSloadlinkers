-- 069_platform_admin_org_suspension.sql
-- Platform-admin org suspension + read-only org preview session tracking.
--
-- account_status enforcement happens in middleware, not RLS: a platform
-- admin still needs to read a suspended org's data (support, investigation),
-- so RLS on organizations/loads/etc is deliberately left untouched here.
--
-- Both writes below (suspension changes, preview session open/close) go
-- through SECURITY DEFINER functions that self-check is_platform_admin(),
-- matching get_platform_organizations() (022) rather than adding new RLS
-- UPDATE/INSERT policies -- organizations has no platform-admin UPDATE
-- policy today and this migration does not add one.

begin;

alter table organizations
  add column account_status text not null default 'active'
    check (account_status in ('active', 'suspended')),
  add column suspended_at timestamptz,
  add column suspended_by uuid references profiles (id) on delete set null,
  add column suspended_reason text;

create table platform_admin_access_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users (id) on delete cascade,
  target_org_id uuid not null references organizations (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  reason text
);

create index platform_admin_access_log_target_org_id_idx on platform_admin_access_log (target_org_id);
create index platform_admin_access_log_admin_user_id_idx on platform_admin_access_log (admin_user_id);

alter table platform_admin_access_log enable row level security;

-- Append-only: select only, restricted to platform admins. No insert/update
-- policy -- rows are only ever written by the SECURITY DEFINER functions
-- below, never directly by a client.
create policy "platform_admin_access_log_select_platform_admin"
  on platform_admin_access_log for select
  using (public.is_platform_admin(auth.uid()));

create or replace function public.set_organization_account_status(
  p_org_id uuid,
  p_status text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_before jsonb;
  v_after jsonb;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'Only platform admins may change an organization''s account status';
  end if;

  if p_status not in ('active', 'suspended') then
    raise exception 'Invalid account_status: %', p_status;
  end if;

  select to_jsonb(o) into v_before from organizations o where o.id = p_org_id;
  if v_before is null then
    raise exception 'Organization % not found', p_org_id;
  end if;

  update organizations
  set
    account_status = p_status,
    suspended_at = case when p_status = 'suspended' then now() else null end,
    suspended_by = case when p_status = 'suspended' then auth.uid() else null end,
    suspended_reason = case when p_status = 'suspended' then p_reason else null end,
    updated_at = now()
  where id = p_org_id;

  select to_jsonb(o) into v_after from organizations o where o.id = p_org_id;

  insert into platform_audit_log (actor_admin_id, action, org_id, before_json, after_json)
  values (auth.uid(), 'organization.' || p_status, p_org_id, v_before, v_after);

  insert into audit_events (org_id, actor_user_id, entity_type, entity_id, action, before_json, after_json)
  values (p_org_id, auth.uid(), 'organization', p_org_id, 'update', v_before, v_after);
end;
$$;

revoke all on function public.set_organization_account_status(uuid, text, text) from public;
grant execute on function public.set_organization_account_status(uuid, text, text) to authenticated;

create or replace function public.start_platform_admin_preview(
  p_org_id uuid,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_log_id uuid;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'Only platform admins may start an organization preview session';
  end if;

  if not exists (select 1 from organizations where id = p_org_id) then
    raise exception 'Organization % not found', p_org_id;
  end if;

  insert into platform_admin_access_log (admin_user_id, target_org_id, reason)
  values (auth.uid(), p_org_id, p_reason)
  returning id into v_log_id;

  return v_log_id;
end;
$$;

revoke all on function public.start_platform_admin_preview(uuid, text) from public;
grant execute on function public.start_platform_admin_preview(uuid, text) to authenticated;

create or replace function public.end_platform_admin_preview(p_log_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'Only platform admins may end an organization preview session';
  end if;

  update platform_admin_access_log
  set ended_at = now()
  where id = p_log_id
    and admin_user_id = auth.uid()
    and ended_at is null;
end;
$$;

revoke all on function public.end_platform_admin_preview(uuid) from public;
grant execute on function public.end_platform_admin_preview(uuid) to authenticated;

-- Surface the new columns on the existing cross-tenant roster RPC so the
-- platform-admin organizations list can show/act on suspension state. The
-- return row shape is changing, so the old function must be dropped first
-- (create or replace cannot change OUT-parameter types).
drop function if exists public.get_platform_organizations();

create function public.get_platform_organizations()
returns table (
  org_id uuid,
  name text,
  workspace_type text,
  plan_tier text,
  subscription_state text,
  seat_count integer,
  trial_ends_at timestamptz,
  created_at timestamptz,
  account_status text,
  suspended_reason text
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
      o.created_at,
      o.account_status,
      o.suspended_reason
    from organizations o
    left join subscriptions s on s.org_id = o.id
    order by o.created_at desc;
end;
$$;

revoke all on function public.get_platform_organizations() from public;
grant execute on function public.get_platform_organizations() to authenticated;

commit;
