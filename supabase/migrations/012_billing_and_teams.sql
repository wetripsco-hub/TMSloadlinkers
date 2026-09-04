-- =====================================================================
-- 012_billing_and_teams.sql
-- Phase 7 / Task P7-T1
--
-- Adds:
--   * subscriptions   — one row per org, mirrors Stripe state
--   * invitations     — pending team members (hashed tokens)
--   * stripe_events   — webhook idempotency ledger
--   * seats_used()    — active profiles + open invites
--   * org_can_write() — subscription gate used by RLS
--   * RESTRICTIVE write policies on loads/carriers/customers/invoices
--
-- IMPORTANT — why RESTRICTIVE policies:
--   This migration does NOT drop or rewrite any existing policy. Postgres
--   evaluates PERMISSIVE policies with OR and RESTRICTIVE policies with
--   AND. By adding RESTRICTIVE policies we layer the subscription gate on
--   top of whatever tenant-scoping policies 001–011 already established,
--   without needing to know their names and without risk of regression.
--
-- IMPORTANT — why SECURITY DEFINER helpers:
--   011_fix_rls_recursion.sql exists, which means the
--   "subquery back into profiles inside a profiles policy" recursion has
--   already bitten this schema once. Every helper below is SECURITY
--   DEFINER with a pinned search_path so it reads its source tables
--   WITHOUT re-entering RLS. Do not rewrite these as inline subqueries.
-- =====================================================================

begin;

create extension if not exists citext;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 0a. Member deactivation
--
-- The live profiles table has no way to mark a member inactive. Added
-- here because seat accounting (section 4) and invite management
-- (section 2) both need to distinguish an active member from one whose
-- seat should be freed without deleting their row and orphaning the
-- records they authored.
-- ---------------------------------------------------------------------
alter table profiles
  add column if not exists is_active boolean not null default true;

comment on column profiles.is_active is
  'False deactivates a member: frees their seat while preserving their audit trail and authored records. Prefer this over deleting a profile.';

create index if not exists idx_profiles_org_active
  on profiles (org_id) where is_active;

-- ---------------------------------------------------------------------
-- 0. Caller's org — recursion-safe
--
-- 011_fix_rls_recursion.sql already defines this helper as
-- public.get_auth_user_org_id(). Reused here rather than redefined so
-- there is exactly one function answering "what org is this caller in".
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 1. SUBSCRIPTIONS
--
-- Stripe is the source of truth. Every write to this table comes from the
-- webhook handler using the service-role key, which bypasses RLS entirely.
-- Clients get SELECT and nothing else.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_state') then
    create type subscription_state as enum (
      'trialing', 'active', 'past_due', 'canceled', 'expired'
    );
  end if;
end $$;

create table if not exists subscriptions (
  org_id                  uuid primary key
                            references organizations(id) on delete cascade,

  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,

  plan                    subscription_plan_tier not null default 'starter',
  state                   subscription_state     not null default 'trialing',
  seat_limit              integer                not null default 3
                            check (seat_limit > 0),

  trial_ends_at           timestamptz not null,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,

  -- Display-only card metadata. Never a PAN, never a chargeable token.
  card_brand              text,
  card_last4              varchar(4),
  card_exp_month          integer check (card_exp_month between 1 and 12),
  card_exp_year           integer check (card_exp_year between 2024 and 2100),

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table subscriptions is
  'One row per org mirroring Stripe. Written only by the webhook via service role.';
comment on column subscriptions.card_last4 is
  'Display only. Storing a PAN here would put this database in PCI scope.';

create index if not exists idx_subscriptions_state
  on subscriptions (state);
create index if not exists idx_subscriptions_trial_ends
  on subscriptions (trial_ends_at)
  where state = 'trialing';

alter table subscriptions enable row level security;

drop policy if exists "members read own subscription" on subscriptions;
create policy "members read own subscription"
  on subscriptions for select
  to authenticated
  using (org_id = get_auth_user_org_id());

-- No insert/update/delete policy is defined on purpose. With RLS enabled
-- and no matching policy, every client write is denied. The webhook uses
-- the service-role key and is unaffected.

-- ---------------------------------------------------------------------
-- 2. INVITATIONS
--
-- We store the SHA-256 hash of the invite token, never the token itself.
-- If this table leaks, the tokens in it are useless.
-- ---------------------------------------------------------------------
create table if not exists invitations (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id) on delete cascade,
  email        citext not null,
  role         user_role_type not null default 'member',
  token_hash   text not null unique,
  invited_by   uuid references profiles(id) on delete set null,
  expires_at   timestamptz not null default (now() + interval '7 days'),
  accepted_at  timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

comment on table invitations is
  'Pending team invites. token_hash is SHA-256 of the token; the raw token is emailed and never stored.';

-- One live invite per email per org. Re-inviting requires revoking first,
-- which keeps the seat count honest.
create unique index if not exists one_open_invite_per_email
  on invitations (org_id, email)
  where accepted_at is null and revoked_at is null;

create index if not exists idx_invitations_org_open
  on invitations (org_id)
  where accepted_at is null and revoked_at is null;

alter table invitations enable row level security;

-- Admins manage invites for their own org. Note the role check reads
-- profiles directly rather than through a helper, but this policy is on
-- invitations (not profiles), so there is no recursion path.
drop policy if exists "admins manage org invitations" on invitations;
create policy "admins manage org invitations"
  on invitations for all
  to authenticated
  using (
    org_id = get_auth_user_org_id()
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('owner', 'admin')
        and profiles.is_active
    )
  )
  with check (
    org_id = get_auth_user_org_id()
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('owner', 'admin')
        and profiles.is_active
    )
  );

-- Invite ACCEPTANCE is deliberately not covered by any client policy.
-- The acceptor is not yet a member of the org, so no org-scoped policy
-- could ever match them. Acceptance runs server-side via service role in
-- P7-T7, which hashes the incoming token and looks up the row.

-- ---------------------------------------------------------------------
-- 3. STRIPE EVENTS — idempotency ledger
--
-- Stripe retries delivery. Without this ledger a retried
-- checkout.session.completed applies the upgrade twice.
-- ---------------------------------------------------------------------
create table if not exists stripe_events (
  id            text primary key,          -- Stripe's evt_... id
  type          text not null,
  org_id        uuid references organizations(id) on delete set null,
  payload       jsonb,
  processed_at  timestamptz not null default now()
);

comment on table stripe_events is
  'Webhook idempotency ledger. Insert the event id BEFORE applying any effect; a duplicate key means already processed.';

create index if not exists idx_stripe_events_org
  on stripe_events (org_id, processed_at desc);

alter table stripe_events enable row level security;
-- No policies at all: RLS enabled + zero policies = no client access.
-- Only the service role touches this table.

-- ---------------------------------------------------------------------
-- 4. SEAT ACCOUNTING
--
-- Open invitations count against the seat limit. If they did not, an
-- admin on a 3-seat plan could send fifty invites and you would discover
-- the overage only when they all accepted at once.
-- ---------------------------------------------------------------------
create or replace function seats_used(p_org_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    (select count(*)
       from profiles
      where org_id = p_org_id
        and is_active = true)
  + (select count(*)
       from invitations
      where org_id = p_org_id
        and accepted_at is null
        and revoked_at  is null
        and expires_at  > now());
$$;

comment on function seats_used is
  'Active members plus open unexpired invitations for an org.';

revoke all on function seats_used(uuid) from public;
grant execute on function seats_used(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 5. WRITE GATE
--
-- Single definition of "is this org allowed to write". Referenced by the
-- restrictive policies below and by application code in P7-T9.
--
-- past_due gets a 7-day grace window past period end so that a failed
-- card retry does not lock a paying customer out mid-shipment. Freight
-- moves whether or not a card bounced.
-- ---------------------------------------------------------------------
create or replace function org_can_write(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from subscriptions s
    where s.org_id = p_org_id
      and (
           (s.state = 'trialing' and s.trial_ends_at > now())
        or  s.state = 'active'
        or (s.state = 'past_due'
            and s.current_period_end is not null
            and s.current_period_end > now() - interval '7 days')
      )
  );
$$;

comment on function org_can_write is
  'Subscription write gate. Reads are never blocked by this — only inserts and updates.';

revoke all on function org_can_write(uuid) from public;
grant execute on function org_can_write(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 6. RESTRICTIVE WRITE POLICIES
--
-- These AND with the existing permissive tenant policies from 001–011.
-- SELECT and DELETE are intentionally untouched: an expired org must be
-- able to read and export everything it created. Locking people out of
-- their own data is how you guarantee they never come back and pay.
-- ---------------------------------------------------------------------

-- loads
drop policy if exists "subscription gate insert loads" on loads;
create policy "subscription gate insert loads"
  on loads as restrictive for insert
  to authenticated
  with check (org_can_write(org_id));

drop policy if exists "subscription gate update loads" on loads;
create policy "subscription gate update loads"
  on loads as restrictive for update
  to authenticated
  using (org_can_write(org_id))
  with check (org_can_write(org_id));

-- carriers
drop policy if exists "subscription gate insert carriers" on carriers;
create policy "subscription gate insert carriers"
  on carriers as restrictive for insert
  to authenticated
  with check (org_can_write(org_id));

drop policy if exists "subscription gate update carriers" on carriers;
create policy "subscription gate update carriers"
  on carriers as restrictive for update
  to authenticated
  using (org_can_write(org_id))
  with check (org_can_write(org_id));

-- customers
drop policy if exists "subscription gate insert customers" on customers;
create policy "subscription gate insert customers"
  on customers as restrictive for insert
  to authenticated
  with check (org_can_write(org_id));

drop policy if exists "subscription gate update customers" on customers;
create policy "subscription gate update customers"
  on customers as restrictive for update
  to authenticated
  using (org_can_write(org_id))
  with check (org_can_write(org_id));

-- invoices
drop policy if exists "subscription gate insert invoices" on invoices;
create policy "subscription gate insert invoices"
  on invoices as restrictive for insert
  to authenticated
  with check (org_can_write(org_id));

drop policy if exists "subscription gate update invoices" on invoices;
create policy "subscription gate update invoices"
  on invoices as restrictive for update
  to authenticated
  using (org_can_write(org_id))
  with check (org_can_write(org_id));

-- ---------------------------------------------------------------------
-- 7. updated_at maintenance
-- ---------------------------------------------------------------------
create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_subscriptions_touch on subscriptions;
create trigger trg_subscriptions_touch
  before update on subscriptions
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------
-- 8. BACKFILL
--
-- Existing orgs predate this table and would be locked out on the next
-- write. Give every one of them a 14-day trial starting now.
-- ---------------------------------------------------------------------
insert into subscriptions (org_id, trial_ends_at)
select o.id, now() + interval '14 days'
from organizations o
where not exists (
  select 1 from subscriptions s where s.org_id = o.id
);

commit;

-- =====================================================================
-- VERIFICATION — run these by hand after applying. Not part of the
-- migration; do not wrap them in the transaction above.
-- =====================================================================
--
-- 8.1 Did any org miss the backfill? Expect 0.
--   select count(*) from organizations o
--   left join subscriptions s on s.org_id = o.id
--   where s.org_id is null;
--
-- 8.2 Resolved: 011 already defines the org-lookup helper as
--     get_auth_user_org_id(). This migration reuses it directly and does
--     not define a helper of its own.
--
-- 8.3 Confirm the restrictive policies landed alongside, not instead of,
--     the existing ones. Expect permissive AND restrictive rows per table.
--   select tablename, policyname, permissive, cmd
--   from pg_policies
--   where schemaname = 'public'
--     and tablename in ('loads','carriers','customers','invoices')
--   order by tablename, permissive desc, cmd;
--
-- 8.4 Gate behaviour. Replace <ORG> with a real org id.
--   select org_can_write('<ORG>');                       -- expect true
--   update subscriptions set state = 'expired' where org_id = '<ORG>';
--   select org_can_write('<ORG>');                       -- expect false
--   -- now, AS THAT ORG'S USER (not service role, not SQL editor owner):
--   --   select count(*) from loads;   -- expect the usual count, reads still work
--   --   insert into loads (...);      -- expect: new row violates row-level security
--   update subscriptions set state = 'trialing' where org_id = '<ORG>';
--
--   Note: the Supabase SQL editor runs as a superuser role that bypasses
--   RLS. Test 8.4's insert from the application, or with
--   `set role authenticated;` plus a JWT claim, or the policy will appear
--   not to work when in fact it is simply not being applied to you.
--
-- 8.5 Seat counting.
--   select seats_used('<ORG>'), seat_limit from subscriptions where org_id = '<ORG>';
-- =====================================================================
