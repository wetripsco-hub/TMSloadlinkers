-- 023_support_tickets.sql
-- Tenant-to-platform support desk: tickets a tenant raises, platform admins
-- triage and answer them via a threaded message log. Two-sided RLS: each
-- select/insert policy is written as tenant-own-org OR platform-admin,
-- reusing get_auth_user_org_id() (011_fix_rls_recursion.sql) and
-- is_platform_admin() (021_platform_admin.sql) so neither side needs to
-- know the other's internal shape.
--
-- assigned_to references platform_admins(user_id), not auth.users(id) --
-- a ticket can only ever be assigned to someone who is actually a platform
-- admin, enforced by the foreign key itself rather than app-layer checks.

begin;

create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  subject text not null,
  description text not null,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to uuid references platform_admins (user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index support_tickets_org_id_idx on support_tickets (org_id);
create index support_tickets_status_idx on support_tickets (status);
create index support_tickets_assigned_to_idx on support_tickets (assigned_to);

drop trigger if exists trg_support_tickets_touch on support_tickets;
create trigger trg_support_tickets_touch
  before update on support_tickets
  for each row execute function touch_updated_at();

create table support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets (id) on delete cascade,
  sender_id uuid references auth.users (id) on delete set null,
  sender_type text not null check (sender_type in ('tenant', 'platform_admin')),
  message text not null,
  created_at timestamptz not null default now()
);

create index support_ticket_messages_ticket_id_idx on support_ticket_messages (ticket_id);

alter table support_tickets enable row level security;
alter table support_ticket_messages enable row level security;

-- ---------------------------------------------------------------------
-- support_tickets
-- ---------------------------------------------------------------------

create policy "support_tickets_select"
  on support_tickets for select
  using (
    org_id = public.get_auth_user_org_id()
    or public.is_platform_admin(auth.uid())
  );

create policy "support_tickets_insert_tenant"
  on support_tickets for insert
  with check (
    org_id = public.get_auth_user_org_id()
    and created_by = auth.uid()
  );

-- Tenants never update a ticket row directly (no status/assignment control
-- from their side); only platform admins can, e.g. "assign to me" or
-- closing a ticket.
create policy "support_tickets_update_platform_admin"
  on support_tickets for update
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- support_ticket_messages
-- ---------------------------------------------------------------------

create policy "support_ticket_messages_select"
  on support_ticket_messages for select
  using (
    exists (
      select 1 from support_tickets t
      where t.id = ticket_id
        and (
          t.org_id = public.get_auth_user_org_id()
          or public.is_platform_admin(auth.uid())
        )
    )
  );

create policy "support_ticket_messages_insert_tenant"
  on support_ticket_messages for insert
  with check (
    sender_type = 'tenant'
    and sender_id = auth.uid()
    and exists (
      select 1 from support_tickets t
      where t.id = ticket_id
        and t.org_id = public.get_auth_user_org_id()
    )
  );

create policy "support_ticket_messages_insert_platform_admin"
  on support_ticket_messages for insert
  with check (
    sender_type = 'platform_admin'
    and sender_id = auth.uid()
    and public.is_platform_admin(auth.uid())
  );

commit;
