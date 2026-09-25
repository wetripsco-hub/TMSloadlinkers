-- =====================================================================
-- 076_email_verification.sql
--
-- Adds a custom email-verification flow driven by the Resend welcome
-- email (the verify link is embedded in it) rather than Supabase Auth's
-- own confirmation email, since Auth's "Confirm email" setting is off
-- for this project and signups get an immediate session.
--
-- profiles.email_verified_at: null until the user clicks the link in
-- their welcome email. Existing accounts are backfilled to verified
-- (created_at) so nobody already using the app gets locked out
-- retroactively -- only new signups from here on are required to verify.
--
-- email_verification_tokens: one-time tokens minted server-side and
-- consumed by GET /api/verify-email. RLS is enabled with no policies, so
-- only the service-role client (used by the verify route and the signup
-- email action) can read or write it -- anon/authenticated get nothing.
-- =====================================================================

begin;

alter table profiles
  add column if not exists email_verified_at timestamptz;

update profiles
set email_verified_at = created_at
where email_verified_at is null;

create table if not exists email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_verification_tokens_profile_id_idx
  on email_verification_tokens(profile_id);

alter table email_verification_tokens enable row level security;

comment on table email_verification_tokens is
  'One-time email-verification tokens. No RLS policies defined -- only the service-role client (verify-email route, signup email action) can access this table.';
comment on column profiles.email_verified_at is
  'Set when the user clicks the verify link in their welcome email. Backfilled to created_at for pre-076 accounts. getAccessStatus() locks write access if this is still null 7 days after signup.';

commit;
