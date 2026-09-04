-- 010_load_status_guard_trigger.sql
-- 003_load_status_guard.sql created guard_load_status_transition() and bound
-- it to loads via the loads_status_guard trigger. 006 replaced the function
-- body with the domain-aligned transition chain but assumed the 003 trigger
-- binding already existed and only issued CREATE OR REPLACE FUNCTION. Since
-- 003's enum/trigger content is superseded by 006, 003 itself is skipped in
-- this environment's migration order -- so the binding must be created here.

create trigger loads_status_guard
  before update on loads
  for each row
  when (new.status is distinct from old.status)
  execute function guard_load_status_transition();
