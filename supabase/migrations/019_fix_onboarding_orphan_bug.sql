-- =====================================================================
-- 019_fix_onboarding_orphan_bug.sql
--
-- Root cause (confirmed via manual RPC reproduction on the live project):
-- complete_onboarding()'s `update profiles set org_id = ... where id =
-- v_uid` is a silent no-op when the caller has no profiles row at all --
-- Postgres does not raise an error for a zero-row UPDATE. The function
-- still returned the freshly created org_id as if it had succeeded, so
-- the client saw no error, redirected to /overview, got bounced back to
-- /onboarding by the dashboard layout's org check (profiles.org_id still
-- null), and resubmitted -- minting a brand-new orphaned organizations
-- row on every attempt.
--
-- The missing profiles rows themselves trace back to handle_new_auth_user()
-- (001_foundation.sql), an AFTER INSERT trigger on auth.users, not firing
-- (or failing silently) for 6 existing accounts.
--
-- This migration: (1) backfills the missing profiles rows so those
-- accounts can complete onboarding normally, (2) hardens
-- complete_onboarding() so this failure mode raises instead of silently
-- reporting success, (3) removes the 3 orphaned organizations rows that
-- resulted from the bug.
-- =====================================================================

begin;

-- 1. BACKFILL: create profiles rows for auth.users accounts that never
-- got one. org_id is left null so these accounts go through the normal
-- onboarding flow next time they hit the dashboard layout guard.
insert into profiles (id, email)
select u.id, u.email
from auth.users u
left join profiles p on p.id = u.id
where p.id is null;

-- 2. GUARD: complete_onboarding() unchanged except for a not-found check
-- immediately after the profiles update, so a zero-row update now fails
-- loudly instead of returning a fake success with a dangling org row.
create or replace function public.complete_onboarding(
  p_org_name text,
  p_workspace_type text,
  p_full_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_existing_org_id uuid;
  v_new_org_id uuid;
begin
  if v_uid is null then
    raise exception 'complete_onboarding requires an authenticated caller';
  end if;

  if p_org_name is null or length(trim(p_org_name)) = 0 then
    raise exception 'Organization name is required';
  end if;

  -- Idempotent: a caller who already completed onboarding (or is retrying
  -- after a partial failure that did land the org_id) gets their existing
  -- org back instead of a hard duplicate error.
  select org_id into v_existing_org_id
  from profiles
  where id = v_uid;

  if v_existing_org_id is not null then
    return v_existing_org_id;
  end if;

  insert into organizations (name, workspace_type)
  values (trim(p_org_name), p_workspace_type::tenant_workspace_type)
  returning id into v_new_org_id;

  update profiles
  set org_id = v_new_org_id,
      role = 'owner',
      full_name = coalesce(nullif(trim(p_full_name), ''), full_name)
  where id = v_uid;

  if not found then
    raise exception 'complete_onboarding: no profiles row found for user %', v_uid;
  end if;

  return v_new_org_id;
end;
$$;

comment on function public.complete_onboarding is
  'Atomically creates an organization and links the caller''s profile to it. Idempotent: returns the existing org_id if the caller already has one. Raises if the caller has no profiles row, rather than silently leaving an orphaned organization.';

revoke all on function public.complete_onboarding(text, text, text) from public;
grant execute on function public.complete_onboarding(text, text, text) to authenticated;

-- 3. CLEANUP: remove the 3 orphaned organizations rows created by repeated
-- onboarding attempts that hit the silent-failure bug above. Matched by
-- id, not name, to avoid any future name-collision risk.
delete from organizations
where id in (
  '2afb365c-0444-43b6-9a87-f6e4a153fed4', -- 'wqeqwe'
  'f9e0668c-defe-4391-8241-ae6e329cf65a', -- 'kaka 1 ok'
  'bd0305ff-1759-4646-a71b-b940a1c0c32d'  -- 'asdasadas'
);

commit;
