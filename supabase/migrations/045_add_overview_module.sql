-- =====================================================================
-- 045_add_overview_module.sql
--
-- 'overview' (the /overview landing page) becomes a normal gated module
-- like every other entry in lib/domain/modules.ts, instead of being
-- special-cased as always-visible in AppSidebar/middleware. Every
-- existing profile is backfilled to include it so no current user loses
-- access to their own landing page; new profiles/invites keep defaulting
-- to the full set, now including 'overview'.
--
-- Order matters: the old CHECK constraints don't know about 'overview'
-- yet, so they're dropped before the backfill runs (otherwise the
-- backfill's own UPDATE would violate them).
-- =====================================================================

begin;

alter table profiles drop constraint profiles_allowed_modules_known_keys;
alter table invitations drop constraint invitations_allowed_modules_known_keys;

update profiles
set allowed_modules = array_append(allowed_modules, 'overview')
where not ('overview' = any(allowed_modules));

alter table profiles
  alter column allowed_modules set default array[
    'overview', 'loads', 'carriers', 'customers', 'invoices', 'settlements',
    'reports', 'documents', 'review_queue', 'driver_tracking'
  ]::text[];

alter table invitations
  alter column allowed_modules set default array[
    'overview', 'loads', 'carriers', 'customers', 'invoices', 'settlements',
    'reports', 'documents', 'review_queue', 'driver_tracking'
  ]::text[];

alter table profiles
  add constraint profiles_allowed_modules_known_keys
  check (allowed_modules <@ array[
    'overview', 'loads', 'carriers', 'customers', 'invoices', 'settlements',
    'reports', 'documents', 'review_queue', 'driver_tracking'
  ]::text[]);

alter table invitations
  add constraint invitations_allowed_modules_known_keys
  check (allowed_modules <@ array[
    'overview', 'loads', 'carriers', 'customers', 'invoices', 'settlements',
    'reports', 'documents', 'review_queue', 'driver_tracking'
  ]::text[]);

commit;
