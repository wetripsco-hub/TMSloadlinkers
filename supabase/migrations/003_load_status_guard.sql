-- 003_load_status_guard.sql
-- Guard against illegal loads.status transitions.

-- ============================================================================
-- Function: validate a loads.status transition
-- ============================================================================

-- Legal forward chain: draft -> booked -> dispatched -> in_transit ->
-- delivered -> completed. Any status may transition to cancelled. All other
-- transitions (skipping a step, moving backward, or leaving a terminal
-- state) are rejected.
create or replace function guard_load_status_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status = 'cancelled' then
    return new;
  end if;

  if (old.status, new.status) in (
    ('draft', 'booked'),
    ('booked', 'dispatched'),
    ('dispatched', 'in_transit'),
    ('in_transit', 'delivered'),
    ('delivered', 'completed')
  ) then
    return new;
  end if;

  raise exception 'illegal load status transition: % -> % (load id %)',
    old.status, new.status, old.id;
end;
$$;

-- ============================================================================
-- Trigger
-- ============================================================================

create trigger loads_status_guard
  before update on loads
  for each row
  when (new.status is distinct from old.status)
  execute function guard_load_status_transition();
