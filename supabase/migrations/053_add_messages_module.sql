-- =====================================================================
-- 053_add_messages_module.sql
--
-- 'messages' (the /messages inbox) becomes a normal gated module like
-- every other entry in lib/domain/modules.ts, following the exact
-- precedent set by 045_add_overview_module.sql for 'overview'. Every
-- existing profile is backfilled to include it so no current user loses
-- access to a module they'd otherwise already have had by default; new
-- profiles/invites keep defaulting to the full set, now including
-- 'messages'.
--
-- Order matters: the old CHECK constraints don't know about 'messages'
-- yet, so they're dropped before the backfill runs (otherwise the
-- backfill's own UPDATE would violate them).
-- =====================================================================

begin;

alter table profiles drop constraint profiles_allowed_modules_known_keys;
alter table invitations drop constraint invitations_allowed_modules_known_keys;

update profiles
set allowed_modules = array_append(allowed_modules, 'messages')
where not ('messages' = any(allowed_modules));

alter table profiles
  alter column allowed_modules set default array[
    'overview', 'loads', 'carriers', 'customers', 'invoices', 'settlements',
    'reports', 'documents', 'review_queue', 'driver_tracking', 'messages'
  ]::text[];

alter table invitations
  alter column allowed_modules set default array[
    'overview', 'loads', 'carriers', 'customers', 'invoices', 'settlements',
    'reports', 'documents', 'review_queue', 'driver_tracking', 'messages'
  ]::text[];

alter table profiles
  add constraint profiles_allowed_modules_known_keys
  check (allowed_modules <@ array[
    'overview', 'loads', 'carriers', 'customers', 'invoices', 'settlements',
    'reports', 'documents', 'review_queue', 'driver_tracking', 'messages'
  ]::text[]);

alter table invitations
  add constraint invitations_allowed_modules_known_keys
  check (allowed_modules <@ array[
    'overview', 'loads', 'carriers', 'customers', 'invoices', 'settlements',
    'reports', 'documents', 'review_queue', 'driver_tracking', 'messages'
  ]::text[]);

commit;
