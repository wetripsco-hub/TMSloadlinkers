-- =====================================================================
-- 033_load_volume_by_period.sql
--
-- Net-new reporting function, same shape/conventions as 032's
-- get_revenue_by_period: a zero-filled generate_series spine over the
-- caller's date range, bucketed by week or month. Counts loads by
-- pickup_date instead of summing revenue/margin. Does not modify any
-- existing view or the functions added in 032.
-- =====================================================================

begin;

create or replace function get_load_volume_by_period(
  p_org_id uuid,
  p_start_date date,
  p_end_date date,
  p_bucket text default 'week'
)
returns table (
  bucket_start date,
  load_count bigint
)
language plpgsql
security invoker
stable
set search_path = public, pg_temp
as $$
declare
  v_step interval;
begin
  if p_bucket not in ('week', 'month') then
    raise exception 'get_load_volume_by_period: p_bucket must be ''week'' or ''month'' (got %)', p_bucket;
  end if;

  v_step := case p_bucket when 'week' then interval '1 week' else interval '1 month' end;

  return query
  with bucket_spine as (
    select generate_series(
      date_trunc(p_bucket, p_start_date::timestamp),
      date_trunc(p_bucket, p_end_date::timestamp),
      v_step
    )::date as bucket_start
  ),
  bucketed_loads as (
    select
      date_trunc(p_bucket, loads.pickup_date)::date as bucket_start,
      count(*) as load_count
    from loads
    where loads.org_id = p_org_id
      and loads.pickup_date::date between p_start_date and p_end_date
    group by 1
  )
  select
    bucket_spine.bucket_start,
    coalesce(bucketed_loads.load_count, 0) as load_count
  from bucket_spine
  left join bucketed_loads using (bucket_start)
  order by bucket_spine.bucket_start;
end;
$$;

comment on function get_load_volume_by_period(uuid, date, date, text) is
  'Zero-filled load count per week/month bucket over an arbitrary date range, same spine pattern as get_revenue_by_period (032). No status/needs_shipper_rate filtering -- this counts all loads, not revenue-bearing ones.';

commit;
