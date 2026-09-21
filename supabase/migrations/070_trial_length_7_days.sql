-- =====================================================================
-- 070_trial_length_7_days.sql
--
-- Shortens the default trial from 14 to 7 days, matching the landing/
-- pricing page copy (already 7 days as of an earlier pass). Same pattern
-- as 015_function_search_path.sql: default_trial_interval() is redefined
-- via `create or replace function` rather than editing 013 or 015, which
-- are already applied and are not edited.
--
-- provision_trial_subscription() (013) calls this function rather than
-- hardcoding the interval, so redefining it here is enough -- the trigger
-- itself does not need to change.
-- =====================================================================

begin;

create or replace function default_trial_interval()
returns interval
language sql
immutable
set search_path = public, pg_temp
as $$
  select interval '7 days';
$$;

comment on function default_trial_interval is
  'Single source of truth for trial length. Referenced by the provisioning trigger. Changed from 14 to 7 days in 070.';

commit;

-- =====================================================================
-- VERIFICATION
-- =====================================================================
--
-- insert into organizations (name, workspace_type)
-- values ('Trial Length Test Co', 'freight_brokerage')
-- returning id;
--
-- select org_id, plan, state, seat_limit,
--        trial_ends_at::date,
--        (trial_ends_at::date - now()::date) as days_left
-- from subscriptions
-- where org_id = '<the id returned above>';
-- -- expect: starter / trialing / 3 / 7 days out
--
-- delete from organizations where name = 'Trial Length Test Co';
-- =====================================================================
