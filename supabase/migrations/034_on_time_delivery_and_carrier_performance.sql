-- =====================================================================
-- 034_on_time_delivery_and_carrier_performance.sql
--
-- APPROXIMATION NOTICE (read before touching either function below):
-- "On time" here is a date-level approximation, not the structured
-- delivery-window comparison described in docs/TMS_MASTER_BLUEPRINT.md
-- section 1.4 (LoadStop.windowEnd). That field does not exist in this
-- schema -- `loads.destination` is plain text (confirmed against the
-- live table before writing this migration), not a JSONB stop with a
-- windowEnd. There is no structured appointment-window data anywhere in
-- the current schema. Until that's added, "on time" is defined as:
--   actual delivery date <= loads.delivery_date (treated as the
--   committed/planned date, not an appointment window)
-- Replace this approximation once LoadStop-style structured stops with
-- real windowEnd timestamps are added to the schema.
--
-- Actual delivery date derivation: audit_events (004_audit.sql) has no
-- semantic "status changed to delivered" action -- action is constrained
-- to plain 'insert'/'update'/'delete', and before_json/after_json are
-- full to_jsonb(old)/to_jsonb(new) row snapshots, not diffs. So the
-- "delivered" transition is derived as the audit_events row where
-- entity_type = 'loads', action = 'update',
-- after_json ->> 'status' = 'delivered', and
-- before_json ->> 'status' is distinct from 'delivered' -- that row's
-- created_at is the actual delivery timestamp. A live query against
-- entity_type = 'loads' returned zero rows in this database at the time
-- of writing (no load has gone through a real app-driven status update
-- yet -- existing loads were seeded directly via SQL), so every
-- currently-seeded delivered load will fall into the "no audit trail"
-- exclusion bucket below. That is expected, not a bug in these functions.
--
-- Exclusion rule: a delivered load with zero matching audit_events rows,
-- OR a null loads.delivery_date (nothing to compare the audit timestamp
-- against), is excluded from both the numerator and the denominator --
-- same "insufficient data, don't guess" principle used for the
-- originally-specified missing-window case, just triggered by missing
-- audit trail / missing committed date instead of a missing window
-- field. Both cases are folded into excluded_no_audit_trail_count for
-- transparency, since either one means "cannot be scored," not "late."
-- =====================================================================

begin;

-- ============================================================================
-- 1. get_on_time_delivery_pct
-- ============================================================================

create or replace function get_on_time_delivery_pct(
  p_org_id uuid,
  p_start_date date,
  p_end_date date
)
returns table (
  on_time_count bigint,
  total_eligible_count bigint,
  on_time_pct numeric,
  excluded_no_audit_trail_count bigint
)
language sql
security invoker
stable
set search_path = public, pg_temp
as $$
  with delivered_loads as (
    select loads.id, loads.delivery_date
    from loads
    where loads.org_id = p_org_id
      and loads.status = 'delivered'
      and loads.pickup_date::date between p_start_date and p_end_date
  ),
  delivery_events as (
    select
      audit_events.entity_id as load_id,
      min(audit_events.created_at)::date as actual_delivery_date
    from audit_events
    where audit_events.org_id = p_org_id
      and audit_events.entity_type = 'loads'
      and audit_events.action = 'update'
      and audit_events.after_json ->> 'status' = 'delivered'
      and (audit_events.before_json ->> 'status') is distinct from 'delivered'
      and audit_events.entity_id in (select id from delivered_loads)
    group by audit_events.entity_id
  ),
  scored as (
    select
      delivered_loads.id,
      delivered_loads.delivery_date,
      delivery_events.actual_delivery_date,
      (delivery_events.actual_delivery_date is not null
        and delivered_loads.delivery_date is not null) as is_eligible
    from delivered_loads
    left join delivery_events on delivery_events.load_id = delivered_loads.id
  )
  select
    count(*) filter (
      where scored.is_eligible
        and scored.actual_delivery_date <= scored.delivery_date::date
    ) as on_time_count,
    count(*) filter (where scored.is_eligible) as total_eligible_count,
    round(
      case when count(*) filter (where scored.is_eligible) = 0 then null
      else
        (count(*) filter (
          where scored.is_eligible
            and scored.actual_delivery_date <= scored.delivery_date::date
        )::numeric
        / count(*) filter (where scored.is_eligible)) * 100
      end,
      2
    ) as on_time_pct,
    count(*) filter (where not scored.is_eligible) as excluded_no_audit_trail_count
  from scored;
$$;

comment on function get_on_time_delivery_pct(uuid, date, date) is
  'Date-level on-time approximation (actual delivery date, derived from the audit_events insert/update trail, <= loads.delivery_date). Pending structured LoadStop.windowEnd data -- see file header. Excludes delivered loads with no matching audit trail or a null delivery_date from both numerator and denominator.';

-- ============================================================================
-- 2. get_carrier_performance_report
-- ============================================================================

create or replace function get_carrier_performance_report(
  p_org_id uuid,
  p_start_date date,
  p_end_date date
)
returns table (
  carrier_id uuid,
  carrier_name text,
  total_loads bigint,
  delivered_loads bigint,
  on_time_count bigint,
  total_eligible_count bigint,
  on_time_pct numeric,
  excluded_no_audit_trail_count bigint,
  total_carrier_pay numeric
)
language sql
security invoker
stable
set search_path = public, pg_temp
as $$
  with scoped_loads as (
    select loads.*
    from loads
    where loads.org_id = p_org_id
      and loads.carrier_id is not null
      and loads.pickup_date::date between p_start_date and p_end_date
  ),
  delivery_events as (
    select
      audit_events.entity_id as load_id,
      min(audit_events.created_at)::date as actual_delivery_date
    from audit_events
    where audit_events.org_id = p_org_id
      and audit_events.entity_type = 'loads'
      and audit_events.action = 'update'
      and audit_events.after_json ->> 'status' = 'delivered'
      and (audit_events.before_json ->> 'status') is distinct from 'delivered'
      and audit_events.entity_id in (
        select id from scoped_loads where status = 'delivered'
      )
    group by audit_events.entity_id
  ),
  scored as (
    select
      scoped_loads.carrier_id,
      scoped_loads.id,
      scoped_loads.status,
      scoped_loads.carrier_pay,
      scoped_loads.delivery_date,
      delivery_events.actual_delivery_date,
      (scoped_loads.status = 'delivered'
        and delivery_events.actual_delivery_date is not null
        and scoped_loads.delivery_date is not null) as is_eligible
    from scoped_loads
    left join delivery_events on delivery_events.load_id = scoped_loads.id
  )
  select
    carriers.id as carrier_id,
    carriers.name as carrier_name,
    count(scored.id) as total_loads,
    count(scored.id) filter (where scored.status = 'delivered') as delivered_loads,
    count(scored.id) filter (
      where scored.is_eligible
        and scored.actual_delivery_date <= scored.delivery_date::date
    ) as on_time_count,
    count(scored.id) filter (where scored.is_eligible) as total_eligible_count,
    round(
      case when count(scored.id) filter (where scored.is_eligible) = 0 then null
      else
        (count(scored.id) filter (
          where scored.is_eligible
            and scored.actual_delivery_date <= scored.delivery_date::date
        )::numeric
        / count(scored.id) filter (where scored.is_eligible)) * 100
      end,
      2
    ) as on_time_pct,
    count(scored.id) filter (
      where scored.status = 'delivered' and not scored.is_eligible
    ) as excluded_no_audit_trail_count,
    coalesce(sum(scored.carrier_pay), 0) as total_carrier_pay
  from scored
  join carriers on carriers.id = scored.carrier_id and carriers.org_id = p_org_id
  group by carriers.id, carriers.name
  having count(scored.id) > 0
  order by carriers.name;
$$;

comment on function get_carrier_performance_report(uuid, date, date) is
  'Per-carrier load volume, delivered count, on-time pct (same date-level approximation as get_on_time_delivery_pct -- see file header), and total carrier_pay, over an arbitrary date range. Carriers with zero loads in range are excluded.';

commit;
