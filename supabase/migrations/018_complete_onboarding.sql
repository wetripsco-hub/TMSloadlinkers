-- =====================================================================
-- 018_complete_onboarding.sql
--
-- Fixes the signup/onboarding flow leaving users half-linked: a caller
-- could get an organization row inserted (client insert) but then fail
-- the follow-up profile update (RLS edge case, dropped connection,
-- double submit), leaving profiles.org_id null forever with no safe way
-- to retry -- retrying signup just hits "already registered" from
-- auth.signUp, and the old ensure-user-organization.ts fallback upsert
-- had no INSERT policy to land on and silently swallowed its own error.
--
-- complete_onboarding() makes organization creation + profile linking one
-- atomic, idempotent operation: if the caller already has an org, it is
-- a no-op that returns the existing org_id instead of erroring or
-- minting a duplicate organization.
-- =====================================================================

begin;

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

  return v_new_org_id;
end;
$$;

comment on function public.complete_onboarding is
  'Atomically creates an organization and links the caller''s profile to it. Idempotent: returns the existing org_id if the caller already has one.';

revoke all on function public.complete_onboarding(text, text, text) from public;
grant execute on function public.complete_onboarding(text, text, text) to authenticated;

commit;
