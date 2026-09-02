-- 006_load_status_domain_alignment.sql
-- Replace load_operational_status with the full lifecycle used by the
-- Load domain interface (types/domain.ts LoadStatus), so the repository
-- layer never has to translate between two incompatible vocabularies.

-- ============================================================================
-- Enum: swap load_operational_status for the domain-aligned value set
-- ============================================================================

alter table loads alter column status drop default;

create type load_operational_status_new as enum (
  'quoted',
  'posted_to_boards',
  'covered',
  'dispatched',
  'at_pickup',
  'in_transit',
  'at_delivery',
  'delivered',
  'pod_uploaded',
  'invoiced',
  'settled',
  'cancelled'
);

alter table loads
  alter column status type load_operational_status_new
  using (
    case status::text
      when 'draft' then 'quoted'
      when 'booked' then 'covered'
      when 'dispatched' then 'dispatched'
      when 'in_transit' then 'in_transit'
      when 'delivered' then 'delivered'
      when 'completed' then 'settled'
      when 'cancelled' then 'cancelled'
    end
  )::load_operational_status_new;

alter table loads alter column status set default 'quoted';

drop type load_operational_status;
alter type load_operational_status_new rename to load_operational_status;

-- ============================================================================
-- Trigger: legal forward chain over the domain-aligned statuses
-- ============================================================================

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
    ('quoted', 'posted_to_boards'),
    ('posted_to_boards', 'covered'),
    ('covered', 'dispatched'),
    ('dispatched', 'at_pickup'),
    ('at_pickup', 'in_transit'),
    ('in_transit', 'at_delivery'),
    ('at_delivery', 'delivered'),
    ('delivered', 'pod_uploaded'),
    ('pod_uploaded', 'invoiced'),
    ('invoiced', 'settled')
  ) then
    return new;
  end if;

  raise exception 'illegal load status transition: % -> % (load id %)',
    old.status, new.status, old.id;
end;
$$;
