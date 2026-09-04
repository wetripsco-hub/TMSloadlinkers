-- 015_function_search_path.sql
--
-- Fixes the "function search_path mutable" advisor warnings introduced by
-- 012 (touch_updated_at) and 013 (default_trial_interval). Both are
-- redefined here via `create or replace function`; 012 and 013 are already
-- applied and are not edited.
--
-- guard_load_status_transition's pre-existing search_path warning is left
-- alone -- it predates this task and is not ours to touch here.

create or replace function touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function default_trial_interval()
returns interval
language sql
immutable
set search_path = public, pg_temp
as $$
  select interval '14 days';
$$;

comment on function default_trial_interval is
  'Single source of truth for trial length. Referenced by the provisioning trigger.';
