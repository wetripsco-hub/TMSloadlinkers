-- 021_platform_admin.sql
-- Platform-level (cross-tenant) admin surface: a small, separate authority
-- layer from the per-org owner/admin roles in profiles.role. Nothing in
-- this migration is org-scoped -- platform_admins and platform_audit_log
-- sit outside the get_auth_user_org_id() tenancy model entirely.
--
-- No insert/update/delete policy is defined on either table, so RLS denies
-- every client write by default; platform_admins has no select policy
-- either, so the row set itself is not client-readable. The only sanctioned
-- access path is is_platform_admin(uid), a SECURITY DEFINER function that
-- reveals a single boolean, never the admin list. Granting platform admin
-- status is therefore a service-role/SQL-console operation, not something
-- reachable from the app -- matching "no self-serve insert path" above.

begin;

create table platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table platform_admins enable row level security;
-- No policies: RLS denies all client select/insert/update/delete.

create table platform_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_admin_id uuid references auth.users (id) on delete set null,
  action text not null,
  org_id uuid references organizations (id) on delete set null,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create index platform_audit_log_org_id_idx on platform_audit_log (org_id);
create index platform_audit_log_created_at_idx on platform_audit_log (created_at);

alter table platform_audit_log enable row level security;
-- No policies: RLS denies all client select/insert/update/delete. Nothing
-- in this task writes to this table yet -- it exists so a later platform-
-- admin action can log into it via a SECURITY DEFINER function without a
-- follow-up migration to add RLS.

create or replace function public.is_platform_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from platform_admins where user_id = uid);
$$;

revoke all on function public.is_platform_admin(uuid) from public;
grant execute on function public.is_platform_admin(uuid) to authenticated;

commit;
