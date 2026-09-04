-- =====================================================================
-- 017_trial_lifecycle.sql
-- Phase 7 / Task P7-T8
--
-- Feeds the trial-lifecycle edge function the set of orgs that need a
-- lifecycle email this run: trials entering their reminder windows, and
-- trials/expired orgs crossing into (or already past) expiry. The
-- function itself only reads; it does not send or mark anything sent —
-- that stays in the edge function via notifications_sent (016).
-- =====================================================================

begin;

create or replace function trial_lifecycle_targets()
returns table (
  org_id        uuid,
  trial_ends_at timestamptz,
  state         text,
  org_name      text,
  owner_email   text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    s.org_id,
    s.trial_ends_at,
    s.state::text,
    o.name as org_name,
    p.email as owner_email
  from subscriptions s
  join organizations o on o.id = s.org_id
  join profiles p on p.org_id = s.org_id and p.role = 'owner'
  where s.state in ('trialing', 'expired')
    and s.trial_ends_at < now() + interval '8 days';
$$;

comment on function trial_lifecycle_targets is
  'Orgs whose trial is inside its reminder/expiry window, with the owner to email. Read by the trial-lifecycle edge function only.';

revoke all on function trial_lifecycle_targets() from public;
revoke execute on function trial_lifecycle_targets() from public, anon, authenticated;

commit;
