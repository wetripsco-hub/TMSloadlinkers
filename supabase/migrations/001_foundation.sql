-- 001_foundation.sql
-- Foundation schema: tenant organizations, user profiles, and org-scoped RLS.

-- ============================================================================
-- Enums
-- ============================================================================

create type tenant_workspace_type as enum ('shipper', 'carrier', 'broker', 'admin');

create type subscription_plan_tier as enum ('free', 'starter', 'growth', 'enterprise');

create type user_role_type as enum ('owner', 'admin', 'member', 'viewer');

-- ============================================================================
-- Tables
-- ============================================================================

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  workspace_type tenant_workspace_type not null default 'shipper',
  plan_tier subscription_plan_tier not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid references organizations (id) on delete cascade,
  role user_role_type not null default 'member',
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_org_id_idx on profiles (org_id);

-- ============================================================================
-- Trigger: create a profile row whenever a new auth.users row is created
-- ============================================================================

-- New signups have no organization yet; org_id is assigned by a later
-- onboarding step, so the trigger only seeds id/email and leaves org
-- assignment to application logic.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table organizations enable row level security;
alter table profiles enable row level security;

-- organizations: a caller may only see their own org, identified by looking
-- up the caller's profile row for the org_id it belongs to.
create policy "organizations_select_own_org"
  on organizations for select
  using (
    id in (select org_id from profiles where profiles.id = auth.uid())
  );

-- organizations: only members of the org may update its row, and only if
-- the row being written is still their own org (prevents changing org_id
-- of unrelated organizations via a crafted update).
create policy "organizations_update_own_org"
  on organizations for update
  using (
    id in (select org_id from profiles where profiles.id = auth.uid())
  )
  with check (
    id in (select org_id from profiles where profiles.id = auth.uid())
  );

-- profiles: a caller may see any profile that belongs to their own org,
-- not just their own row, so teammates are visible within a tenant. The
-- "or id = auth.uid()" clause covers onboarding, where org_id is still
-- null on the caller's own row and would otherwise match no one's org.
create policy "profiles_select_own_org"
  on profiles for select
  using (
    id = auth.uid()
    or org_id in (select org_id from profiles where profiles.id = auth.uid())
  );

-- profiles: a caller may only update their own profile row. The check
-- allows a null-org row to be assigned an org_id once (onboarding), but
-- once org_id is set it may not be changed to a different org.
create policy "profiles_update_own_row"
  on profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and (
      (select org_id from profiles where profiles.id = auth.uid()) is null
      or org_id = (select org_id from profiles where profiles.id = auth.uid())
    )
  );
