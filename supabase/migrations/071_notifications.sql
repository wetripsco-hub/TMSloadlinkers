-- 071_notifications.sql
-- In-app notifications: org-scoped bell-dropdown feed backing both the
-- existing dashboard "needs attention" system alerts (055/058 v_exceptions
-- conditions) and a new super-admin -> tenant messaging path.
--
-- recipient_user_id null means "visible to every user in org_id" (an
-- org-wide system alert); non-null targets exactly one user (a targeted
-- admin_message, or a per-user system alert if ever needed).
--
-- entity_id is not in the fields the task named explicitly, but the
-- required dedup key (org_id + source + entity_id) needs a column to key
-- on, so it's added here as nullable: system alerts set it (the load or
-- carrier id the alert is about), admin_message rows leave it null since
-- there's no natural entity to dedup against.
--
-- No insert/update policy is defined for plain client writes -- RLS denies
-- both by default. System-alert sync and super-admin sends both run
-- server-side via the service-role client (bypasses RLS entirely), which
-- is the only path allowed to create rows. The one client-writable path is
-- "mark my own notification read", added below as an update policy plus a
-- trigger that pins it to flipping is_read to true and nothing else.

begin;

create type notification_type as enum ('system_alert', 'admin_message');

create table notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  recipient_user_id uuid references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  notification_type notification_type not null,
  source text not null,
  entity_id uuid,
  link_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_org_recipient_created_idx
  on notifications (org_id, recipient_user_id, created_at desc);

-- Dedup key for the check-before-insert/upsert alert sync: one row per
-- (org, source, entity) so re-running the sync never duplicates the same
-- alert. Partial (entity_id is not null) because admin_message rows have
-- no entity to key on and shouldn't collide with each other.
create unique index notifications_org_source_entity_uidx
  on notifications (org_id, source, entity_id)
  where entity_id is not null;

alter table notifications enable row level security;

create policy "notifications_select"
  on notifications for select
  using (
    org_id = public.get_auth_user_org_id()
    and (recipient_user_id is null or recipient_user_id = auth.uid())
  );

-- No insert policy: RLS denies all client inserts. Rows are only ever
-- created server-side with the service-role client.

create policy "notifications_update_mark_read"
  on notifications for update
  using (
    org_id = public.get_auth_user_org_id()
    and (recipient_user_id is null or recipient_user_id = auth.uid())
  )
  with check (
    org_id = public.get_auth_user_org_id()
    and (recipient_user_id is null or recipient_user_id = auth.uid())
  );

create or replace function public.notifications_guard_client_update()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.org_id is distinct from old.org_id
     or new.recipient_user_id is distinct from old.recipient_user_id
     or new.title is distinct from old.title
     or new.body is distinct from old.body
     or new.notification_type is distinct from old.notification_type
     or new.source is distinct from old.source
     or new.entity_id is distinct from old.entity_id
     or new.link_url is distinct from old.link_url
     or new.created_at is distinct from old.created_at
  then
    raise exception 'notifications: only is_read may be changed';
  end if;

  if new.is_read is distinct from old.is_read and new.is_read is not true then
    raise exception 'notifications: is_read can only be set to true';
  end if;

  return new;
end;
$$;

create trigger trg_notifications_guard_client_update
  before update on notifications
  for each row execute function public.notifications_guard_client_update();

commit;
