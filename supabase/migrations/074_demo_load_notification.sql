-- =====================================================================
-- 074_demo_load_notification.sql
--
-- Extends provision_demo_load() (073_demo_load.sql) to also insert a
-- matching notification row into the notifications table (071) so the
-- bell dropdown greets new users with the demo-load context message.
--
-- Atomicity: the notification INSERT is part of the same AFTER INSERT
-- trigger function, so the demo load and its notification are created
-- in the same transaction and can never get out of sync.
--
-- Persistence: notifications.entity_id is a plain uuid column, NOT a
-- foreign key to loads.id, so deleting the demo load later does NOT
-- cascade-delete the notification -- it stays as a historical record.
--
-- Dedup: notifications_org_source_entity_uidx (071) is a partial
-- unique index on (org_id, source, entity_id) WHERE entity_id IS NOT
-- NULL. Setting entity_id = v_load_id means a retry never duplicates.
-- =====================================================================

begin;

create or replace function provision_demo_load()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer_id uuid;
  v_load_id     uuid;
begin
  -- Demo customer so the load shows a realistic name in the loads list.
  insert into customers (org_id, name)
  values (new.id, 'Demo Customer')
  returning id into v_customer_id;

  -- Demo load. Generated columns (load_number, load_seq, broker_margin,
  -- tracking_token, assigned_user_id, created_at, updated_at) are
  -- intentionally omitted; set_load_assigned_user_default picks up
  -- auth.uid() automatically from the calling session context.
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
  )
  returning id into v_load_id;

  -- Matching notification. notification_type = 'system_alert' (the
  -- existing enum value for app-generated informational alerts).
  -- entity_id = v_load_id ties into the dedup index and gives the bell
  -- dropdown a direct link to the load detail page.
  -- recipient_user_id = null makes it visible to every user in the org.
  insert into notifications (
    org_id,
    recipient_user_id,
    title,
    body,
    notification_type,
    source,
    entity_id,
    link_url
  )
  values (
    new.id,
    null,
    'This is a demo load',
    'We''ve added a sample load so you can explore the app. It will be removed automatically when you create your first real load.',
    'system_alert',
    'demo_load',
    v_load_id,
    '/loads/' || v_load_id
  );

  return new;
end;
$$;

comment on function provision_demo_load is
  'Creates a demo customer, demo load, and matching notification for every newly-inserted organization so the dashboard is not empty on first login.';

-- ------------------------------------------------------------------
-- Backfill: add notifications for any demo loads that already exist
-- (created by 073 before this migration ran) and have no notification
-- yet. Safe to run multiple times; the ON CONFLICT clause is a no-op
-- for rows that are already present.
-- ------------------------------------------------------------------
insert into notifications (
  org_id,
  recipient_user_id,
  title,
  body,
  notification_type,
  source,
  entity_id,
  link_url
)
select
  l.org_id,
  null,
  'This is a demo load',
  'We''ve added a sample load so you can explore the app. It will be removed automatically when you create your first real load.',
  'system_alert',
  'demo_load',
  l.id,
  '/loads/' || l.id
from loads l
where l.is_demo = true
on conflict (org_id, source, entity_id)
  where entity_id is not null
  do nothing;

commit;

-- =====================================================================
-- VERIFICATION
-- =====================================================================
--
-- After applying, confirm the trigger creates both rows atomically:
--
--   insert into organizations (name, workspace_type)
--   values ('Notif Test Org', 'freight_brokerage')
--   returning id;
--
--   -- Check demo load:
--   select id, status, is_demo from loads where org_id = '<id>';
--   -- expect: 1 row, is_demo = true
--
--   -- Check notification (same entity_id as the load above):
--   select title, source, entity_id, link_url, is_read
--   from notifications where org_id = '<id>';
--   -- expect: 1 row, source = 'demo_load', is_read = false,
--   --         link_url = '/loads/<load-id>'
--
--   -- Confirm notification survives demo load deletion:
--   delete from loads where org_id = '<id>' and is_demo = true;
--   select count(*) from notifications where org_id = '<id>';
--   -- expect: 1 (notification persists)
--
--   -- Clean up:
--   delete from organizations where name = 'Notif Test Org';
-- =====================================================================
