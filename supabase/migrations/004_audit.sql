-- 004_audit.sql
-- Append-only audit log for loads, invoices, and carriers.

-- ============================================================================
-- Table
-- ============================================================================

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_org_id_idx on audit_events (org_id);
create index audit_events_entity_idx on audit_events (entity_type, entity_id);

-- ============================================================================
-- Trigger: record a before/after snapshot on loads/invoices/carriers writes
-- ============================================================================

-- security definer so the insert into audit_events succeeds even though the
-- table's RLS grants clients no insert policy; the function owner is trusted
-- to only ever write the row shape below.
create or replace function record_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_events (
    org_id, actor_user_id, entity_type, entity_id, action, before_json, after_json
  )
  values (
    coalesce(new.org_id, old.org_id),
    auth.uid(),
    tg_table_name,
    coalesce(new.id, old.id),
    lower(tg_op),
    case when tg_op in ('update', 'delete') then to_jsonb(old) else null end,
    case when tg_op in ('insert', 'update') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

create trigger loads_audit
  after insert or update or delete on loads
  for each row execute function record_audit_event();

create trigger invoices_audit
  after insert or update or delete on invoices
  for each row execute function record_audit_event();

create trigger carriers_audit
  after insert or update or delete on carriers
  for each row execute function record_audit_event();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table audit_events enable row level security;

-- audit_events: org-scoped read only. No insert/update/delete policies are
-- defined, so RLS denies all client writes; rows are only ever created by
-- the security definer trigger function above.
create policy "audit_events_select_own_org"
  on audit_events for select
  using (org_id = (select org_id from profiles where profiles.id = auth.uid()));
