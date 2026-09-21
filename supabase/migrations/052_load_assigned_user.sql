-- 052_load_assigned_user.sql
-- assigned_user_id: the staff member who "owns" a load, used to scope the
-- Messages inbox (app/(dashboard)/messages/page.tsx) to a member's own
-- loads while owners see every load's messages org-wide. Defaults to the
-- creator at insert (set_load_assigned_user_default, below) and is
-- reassignable later -- no reassignment UI ships in this migration, the
-- column is just written programmatically for now.
--
-- No RLS changes: loads_select_own_org (001_foundation.sql) and
-- load_notes_select_own_org (050_load_notes.sql) stay org-wide on purpose.
-- assigned_user_id scoping is a product-level filter applied in the
-- Messages page's own query, layered on top of that org-wide RLS -- not a
-- replacement for it, since other pages (the Loads table, load detail)
-- still need to see every load in the org regardless of who it's assigned
-- to.

alter table loads
  add column assigned_user_id uuid references profiles (id) on delete set null;

comment on column loads.assigned_user_id is
  'Staff member who owns this load for Messages-inbox scoping. Defaults to creator at insert, reassignable later.';

-- SECURITY DEFINER: needs to read auth.uid() at insert time regardless of
-- who ends up satisfying loads_insert_own_org's WITH CHECK; plain BEFORE
-- INSERT triggers run under the same privileges as the statement, so no
-- elevation actually happens here beyond what the inserting role already
-- has -- this mirrors the SECURITY DEFINER usage on every other trigger
-- function in this schema (e.g. handle_new_auth_user, 001_foundation.sql).
create or replace function set_load_assigned_user_default()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assigned_user_id is null then
    new.assigned_user_id := auth.uid();
  end if;
  return new;
end;
$$;

create trigger trg_set_load_assigned_user_default
  before insert on loads
  for each row
  execute function set_load_assigned_user_default();
