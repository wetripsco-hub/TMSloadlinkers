-- 009_tracking.sql
-- Public driver tracking: adds tracking fields to loads and a gps_pings
-- history table. An unauthenticated caller holding only a load's
-- tracking_token can resolve that one load and append a ping to it through
-- the two SECURITY DEFINER functions below -- no RLS policy ever exposes
-- loads or gps_pings directly to the anon role, so a token can only ever
-- reach the single load it was issued for.

alter table loads
  add column tracking_token uuid not null default gen_random_uuid(),
  add column driver_name text,
  add column driver_phone text,
  add column truck_number text,
  add column trailer_number text,
  add column last_known_lat numeric(9, 6),
  add column last_known_lng numeric(9, 6),
  add column last_ping_at timestamptz;

create unique index loads_tracking_token_idx on loads (tracking_token);

create table gps_pings (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references loads (id) on delete cascade,
  lat numeric(9, 6) not null,
  lng numeric(9, 6) not null,
  recorded_at timestamptz not null default now()
);

create index gps_pings_load_id_recorded_at_idx on gps_pings (load_id, recorded_at desc);

alter table gps_pings enable row level security;

-- Authenticated, org-scoped read access mirrors the other operational
-- tables (e.g. dispatchers reviewing a load's ping history from inside the
-- app). The public tracking route never uses this policy -- it goes
-- through record_tracking_ping/get_load_by_tracking_token below instead,
-- since an anon caller has no profile row for this policy to match.
create policy "gps_pings_select_own_org"
  on gps_pings for select
  using (
    load_id in (
      select id from loads
      where loads.org_id = (select org_id from profiles where profiles.id = auth.uid())
    )
  );

-- Resolves a single load from its tracking token, exposing only the
-- fields the public tracking page needs. security definer + a fixed
-- search_path let this bypass RLS deliberately (that is the point -- the
-- token itself is the credential) while never selecting by anything other
-- than the exact token match, so no other load is reachable.
create or replace function get_load_by_tracking_token(p_token uuid)
returns table (
  id uuid,
  status load_operational_status,
  origin text,
  destination text,
  driver_name text,
  truck_number text,
  last_known_lat numeric,
  last_known_lng numeric,
  last_ping_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select id, status, origin, destination, driver_name, truck_number,
         last_known_lat, last_known_lng, last_ping_at
  from loads
  where tracking_token = p_token;
$$;

grant execute on function get_load_by_tracking_token(uuid) to anon, authenticated;

-- Records a GPS ping and refreshes the load's last-known position, scoped
-- entirely by the token -> load_id lookup performed inside the function.
create or replace function record_tracking_ping(p_token uuid, p_lat numeric, p_lng numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_load_id uuid;
begin
  select id into v_load_id from loads where tracking_token = p_token;

  if v_load_id is null then
    raise exception 'Invalid tracking token';
  end if;

  insert into gps_pings (load_id, lat, lng) values (v_load_id, p_lat, p_lng);

  update loads
    set last_known_lat = p_lat, last_known_lng = p_lng, last_ping_at = now()
    where id = v_load_id;
end;
$$;

grant execute on function record_tracking_ping(uuid, numeric, numeric) to anon, authenticated;
