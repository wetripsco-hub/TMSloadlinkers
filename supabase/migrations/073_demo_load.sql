-- =====================================================================
-- 073_demo_load.sql
--
-- Ensures brand-new orgs are never empty on first login: a demo load is
-- auto-created the moment an organization is inserted (same pattern as
-- trg_provision_trial in 013_trial_trigger.sql), and auto-deleted the
-- moment the org's first real load is created via createLoad().
--
-- is_demo = true is the stable identifier for the generated row; it is
-- never set by the application's normal load-creation paths.
-- =====================================================================

begin;

-- ------------------------------------------------------------------
-- 1. Flag column
-- ------------------------------------------------------------------
alter table loads
  add column if not exists is_demo boolean not null default false;

comment on column loads.is_demo is
  'True only for the single auto-generated sample load provisioned on org creation. Deleted automatically when the org owner creates their first real load.';

-- ------------------------------------------------------------------
-- 2. Trigger function: provisions one demo load per new org.
--
-- Runs AFTER INSERT on organizations (same slot as provision_trial_
-- subscription). SECURITY DEFINER so it can write to loads and
-- customers without being blocked by loads_insert_own_org RLS (which
-- checks profiles.org_id, but that update hasn't happened yet at the
-- moment complete_onboarding() fires the org INSERT).
--
-- auth.uid() is forwarded from the calling session through the
-- SECURITY DEFINER stack; set_load_assigned_user_default picks it up
-- automatically on the nested loads INSERT.
-- ------------------------------------------------------------------
create or replace function provision_demo_load()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer_id uuid;
begin
  -- Create a demo customer so the load shows a realistic customer name
  -- in the loads list. This customer is an intentional orphan once the
  -- demo load is deleted; it causes no functional harm and the user can
  -- remove it manually if desired.
  insert into customers (org_id, name)
  values (new.id, 'Demo Customer')
  returning id into v_customer_id;

  -- Create the demo load. load_number, tracking_token, broker_margin,
  -- load_seq, assigned_user_id, created_at, and updated_at are all
  -- generated/defaulted by the schema and are intentionally omitted.
  insert into loads (
    org_id,
    customer_id,
    status,
    origin,
    destination,
    pickup_date,
    delivery_date,
    shipper_rate,
    carrier_pay,
    equipment_type,
    commodity,
    weight_lbs,
    is_demo
  )
  values (
    new.id,
    v_customer_id,
    'covered',
    'Chicago, IL 60601',
    'Houston, TX 77001',
    now() + interval '2 days',
    now() + interval '4 days',
    3200,
    2850,
    'Dry Van',
    'General Freight',
    42000,
    true
  );

  return new;
end;
$$;

comment on function provision_demo_load is
  'Creates a demo customer and demo load for every newly-inserted organization so the dashboard is not empty on first login.';

drop trigger if exists trg_provision_demo_load on organizations;
create trigger trg_provision_demo_load
  after insert on organizations
  for each row
  execute function provision_demo_load();

commit;

-- =====================================================================
-- VERIFICATION
-- =====================================================================
--
-- After applying this migration, confirm the trigger fires on a new org:
--
--   insert into organizations (name, workspace_type)
--   values ('Demo Test Org', 'freight_brokerage')
--   returning id;
--
--   select id, status, origin, destination, shipper_rate, is_demo
--   from loads
--   where org_id = '<id from above>';
--   -- expect: 1 row, is_demo = true, status = covered
--
--   select * from customers where org_id = '<id from above>';
--   -- expect: 1 row, name = 'Demo Customer'
--
--   -- Clean up:
--   delete from organizations where name = 'Demo Test Org';
-- =====================================================================
