-- 037_tracking_checkin.sql
-- Adds the data the public driver check-in page (app/track/[token]/page.tsx)
-- needs but the schema never persisted: a human-readable load number,
-- structured origin/destination facility details, and per-milestone
-- timestamps. Also adds advance_tracking_status(), the public, token-scoped
-- RPC a driver uses to move a load through its pickup/delivery lifecycle.

begin;

-- ---------------------------------------------------------------------
-- 1. Human-readable load number
--
-- loadNumber has been a hardcoded "" in Load domain objects since
-- repositories/loads.ts was written (see its top-of-file comment) because
-- no column ever backed it. An identity column backfills every existing
-- row automatically and guarantees uniqueness without an app-side
-- generation race.
-- ---------------------------------------------------------------------
alter table loads
  add column load_seq bigint generated always as identity,
  add column load_number text generated always as (
    'L-' || lpad(load_seq::text, 6, '0')
  ) stored;

create unique index loads_load_number_idx on loads (load_number);

-- ---------------------------------------------------------------------
-- 2. Structured stop details
--
-- loads.origin/destination have only ever been flat text. LoadStop's
-- facilityName/city/state/zip have been hardcoded null/"" placeholders in
-- toStop() since that function was written. Load already models exactly
-- two stops (origin, destination), not an array, so these are columns on
-- loads rather than a new stops table -- matches the existing shape
-- instead of introducing a second one alongside it.
-- ---------------------------------------------------------------------
alter table loads
  add column origin_facility_name text,
  add column origin_city text,
  add column origin_state text,
  add column origin_zip text,
  add column origin_window_end timestamptz,
  add column destination_facility_name text,
  add column destination_city text,
  add column destination_state text,
  add column destination_zip text,
  add column destination_window_end timestamptz;

-- ---------------------------------------------------------------------
-- 3. Milestone timestamps
--
-- Only last_ping_at (most recent GPS ping) existed before this. These
-- back the driver check-in timeline's per-milestone rows. Stamped only by
-- advance_tracking_status() below, once per milestone.
-- ---------------------------------------------------------------------
alter table loads
  add column arrived_at_pickup_at timestamptz,
  add column departed_pickup_at timestamptz,
  add column arrived_at_delivery_at timestamptz,
  add column delivered_at timestamptz;

-- ---------------------------------------------------------------------
-- 4. get_load_by_tracking_token: expose the new fields
--
-- Same security model as 009_tracking.sql: security definer + a fixed
-- search_path, resolves strictly by exact token match. The return row
-- shape is widening, which Postgres does not allow via CREATE OR REPLACE
-- (OUT-parameter row type mismatch), so the old signature is dropped first.
-- ---------------------------------------------------------------------
drop function if exists get_load_by_tracking_token(uuid);

create function get_load_by_tracking_token(p_token uuid)
returns table (
  id uuid,
  status load_operational_status,
  load_number text,
  origin text,
  destination text,
  origin_facility_name text,
  origin_city text,
  origin_state text,
  origin_zip text,
  pickup_date timestamptz,
  origin_window_end timestamptz,
  destination_facility_name text,
  destination_city text,
  destination_state text,
  destination_zip text,
  delivery_date timestamptz,
  destination_window_end timestamptz,
  driver_name text,
  truck_number text,
  last_known_lat numeric,
  last_known_lng numeric,
  last_ping_at timestamptz,
  arrived_at_pickup_at timestamptz,
  departed_pickup_at timestamptz,
  arrived_at_delivery_at timestamptz,
  delivered_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select id, status, load_number, origin, destination,
         origin_facility_name, origin_city, origin_state, origin_zip,
         pickup_date, origin_window_end,
         destination_facility_name, destination_city, destination_state, destination_zip,
         delivery_date, destination_window_end,
         driver_name, truck_number,
         last_known_lat, last_known_lng, last_ping_at,
         arrived_at_pickup_at, departed_pickup_at, arrived_at_delivery_at, delivered_at
  from loads
  where tracking_token = p_token;
$$;

grant execute on function get_load_by_tracking_token(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. advance_tracking_status: public, token-scoped status advance
--
-- Deliberately does NOT re-implement transition-legality checking. It
-- performs a plain UPDATE on loads.status, and the existing BEFORE UPDATE
-- trigger (guard_load_status_transition, from 003/006) is what enforces
-- the legal forward chain -- an illegal jump raises from the trigger and
-- aborts this function's UPDATE same as it would any other caller's.
-- Duplicating that logic here would create a second copy that could drift
-- from the trigger; the whitelist below is an additional restriction
-- layered on top of the trigger, not a replacement for it: a tracking
-- token may only ever request the four driver-facing statuses, never
-- cancelled/invoiced/settled/etc, regardless of what the trigger would
-- otherwise allow.
--
-- actor_user_id on the resulting audit_events row (loads_audit, from
-- 004_audit.sql) will be null: this runs unauthenticated (anon role, no
-- Supabase Auth session), and auth.uid() is JWT-derived independent of
-- this function's security definer context. That's the existing, already
-- already supported shape for an unauthenticated actor -- audit_events.
-- actor_user_id has no NOT NULL constraint. No schema change was made for
-- this; the before/after_json diff on that row is what distinguishes a
-- token-initiated transition from a dispatcher one.
-- ---------------------------------------------------------------------
create or replace function advance_tracking_status(p_token uuid, p_next_status load_operational_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_load_id uuid;
begin
  if p_next_status not in ('at_pickup', 'in_transit', 'at_delivery', 'delivered') then
    raise exception 'Tracking token may not set status to %', p_next_status;
  end if;

  select id into v_load_id from loads where tracking_token = p_token;

  if v_load_id is null then
    raise exception 'Invalid tracking token';
  end if;

  update loads
    set status = p_next_status,
        arrived_at_pickup_at = case when p_next_status = 'at_pickup' then now() else arrived_at_pickup_at end,
        departed_pickup_at = case when p_next_status = 'in_transit' then now() else departed_pickup_at end,
        arrived_at_delivery_at = case when p_next_status = 'at_delivery' then now() else arrived_at_delivery_at end,
        delivered_at = case when p_next_status = 'delivered' then now() else delivered_at end
    where id = v_load_id;
end;
$$;

grant execute on function advance_tracking_status(uuid, load_operational_status) to anon, authenticated;

commit;

-- =====================================================================
-- VERIFICATION -- run by hand after applying, not part of the migration.
--
-- 5.1 Existing loads all got a load_number. Expect 0.
--   select count(*) from loads where load_number is null;
--
-- 5.2 Legal transition succeeds and stamps the right column.
--   select advance_tracking_status('<token of a dispatched load>', 'at_pickup');
--   select status, arrived_at_pickup_at from loads where tracking_token = '<token>';
--   -- expect status = 'at_pickup', arrived_at_pickup_at populated
--
-- 5.3 Illegal transition rejected by the trigger, not by this function.
--   select advance_tracking_status('<token of a dispatched load>', 'delivered');
--   -- expect: illegal load status transition: dispatched -> delivered (load id ...)
--
-- 5.4 Whitelist rejects out-of-scope statuses even if the trigger would allow them.
--   select advance_tracking_status('<token>', 'cancelled');
--   -- expect: Tracking token may not set status to cancelled
--
-- 5.5 Audit trail for a token-initiated update.
--   select actor_user_id, action, before_json->>'status', after_json->>'status'
--   from audit_events
--   where entity_type = 'loads' and entity_id = '<load id>'
--   order by created_at desc limit 1;
--   -- expect actor_user_id is null, action = 'update'
-- =====================================================================
