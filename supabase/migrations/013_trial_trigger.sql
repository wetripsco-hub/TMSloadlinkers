-- =====================================================================
-- 013_trial_trigger.sql
-- Phase 7 / Task P7-T2
--
-- Guarantees that every organization has a subscription row from the
-- instant it exists. 012 backfilled the orgs that already existed; this
-- handles every org created from now on.
--
-- Why a trigger rather than application code:
--   An org without a subscription row fails org_can_write() and is
--   therefore born locked out. If that provisioning lives in a server
--   action, then any other path that creates an org — a seed script, an
--   admin tool, a future signup variant, a manual insert during support —
--   silently produces a broken tenant. The trigger makes the invariant
--   structural instead of remembered.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Trial length lives in one place. Change it here, not in scattered
-- interval literals across migrations and TypeScript.
-- ---------------------------------------------------------------------
create or replace function default_trial_interval()
returns interval
language sql
immutable
as $$
  select interval '14 days';
$$;

comment on function default_trial_interval is
  'Single source of truth for trial length. Referenced by the provisioning trigger.';

-- ---------------------------------------------------------------------
-- Provisioning trigger
--
-- ON CONFLICT DO NOTHING makes this idempotent: if a caller explicitly
-- inserts its own subscription row in the same transaction, that row wins
-- and this trigger does not fight it.
-- ---------------------------------------------------------------------
create or replace function provision_trial_subscription()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into subscriptions (
    org_id,
    plan,
    state,
    seat_limit,
    trial_ends_at
  )
  values (
    new.id,
    'starter',
    'trialing',
    3,
    now() + default_trial_interval()
  )
  on conflict (org_id) do nothing;

  return new;
end;
$$;

comment on function provision_trial_subscription is
  'Creates the starter trial subscription for a newly inserted organization.';

drop trigger if exists trg_provision_trial on organizations;
create trigger trg_provision_trial
  after insert on organizations
  for each row
  execute function provision_trial_subscription();

commit;

-- =====================================================================
-- VERIFICATION
-- =====================================================================
--
-- 1. A new org gets a trial automatically:
--   insert into organizations (name, workspace_type)
--   values ('Trigger Test Co', 'freight_brokerage')
--   returning id;
--
--   select org_id, plan, state, seat_limit,
--          trial_ends_at::date,
--          (trial_ends_at::date - now()::date) as days_left
--   from subscriptions
--   where org_id = '<the id returned above>';
--   -- expect: starter / trialing / 3 / 14 days out
--
-- 2. And it can immediately write:
--   select org_can_write('<the id returned above>');   -- expect true
--
-- 3. Clean up:
--   delete from organizations where name = 'Trigger Test Co';
--   -- subscriptions row goes with it via ON DELETE CASCADE; confirm:
--   select count(*) from subscriptions s
--   left join organizations o on o.id = s.org_id
--   where o.id is null;   -- expect 0
-- =====================================================================
