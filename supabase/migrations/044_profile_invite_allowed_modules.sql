-- =====================================================================
-- 044_profile_invite_allowed_modules.sql
--
-- Per-member module visibility/routing (not tenant isolation -- org_id/RLS
-- is unaffected). Adds allowed_modules to profiles and invitations, NOT
-- NULL, defaulting to every known module so existing profiles keep their
-- current (unrestricted) access unchanged. The CHECK constraint only
-- guards against unknown keys; it does NOT special-case the 'owner' role
-- -- owners must be treated as unrestricted regardless of this column's
-- contents, enforced in application code (middleware.ts, AppSidebar.tsx,
-- lib/domain/modules.ts), specifically so a DB-level mistake here can
-- never lock an owner out of their own org.
--
-- Module keys must match lib/domain/modules.ts exactly.
-- =====================================================================

begin;

alter table profiles
  add column allowed_modules text[] not null default array[
    'loads', 'carriers', 'customers', 'invoices', 'settlements',
    'reports', 'documents', 'review_queue', 'driver_tracking'
  ]::text[];

alter table invitations
  add column allowed_modules text[] not null default array[
    'loads', 'carriers', 'customers', 'invoices', 'settlements',
    'reports', 'documents', 'review_queue', 'driver_tracking'
  ]::text[];

comment on column profiles.allowed_modules is
  'Sidebar/route visibility for non-owner members -- see lib/domain/modules.ts. Owners bypass this in code regardless of contents.';
comment on column invitations.allowed_modules is
  'Module selection captured at invite time; copied onto profiles.allowed_modules when the invite is accepted (acceptInvite, settings/team/actions.ts).';

alter table profiles
  add constraint profiles_allowed_modules_known_keys
  check (allowed_modules <@ array[
    'loads', 'carriers', 'customers', 'invoices', 'settlements',
    'reports', 'documents', 'review_queue', 'driver_tracking'
  ]::text[]);

alter table invitations
  add constraint invitations_allowed_modules_known_keys
  check (allowed_modules <@ array[
    'loads', 'carriers', 'customers', 'invoices', 'settlements',
    'reports', 'documents', 'review_queue', 'driver_tracking'
  ]::text[]);

commit;
