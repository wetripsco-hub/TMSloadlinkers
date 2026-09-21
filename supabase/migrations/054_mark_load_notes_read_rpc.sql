-- 054_mark_load_notes_read_rpc.sql
-- load_notes has no UPDATE RLS policy (050_load_notes.sql only ever added
-- SELECT and staff-INSERT) -- a raw client-side `.update({ is_read: true })`
-- doesn't error, it just silently affects 0 rows under RLS. This is the one
-- sanctioned write path for marking driver-authored notes read: a
-- SECURITY DEFINER RPC that re-derives the caller's org_id from profiles
-- (never trusts a client-supplied org_id) and only ever flips
-- author_type = 'driver' rows for that org's own load, mirroring
-- add_driver_load_note's SECURITY DEFINER shape (050_load_notes.sql) but
-- for an authenticated staff caller instead of a token-scoped driver one.
--
-- Returns the number of rows actually flipped so callers can distinguish
-- "already read" (0) from "just marked read" (>0) without a second query.

create or replace function mark_load_notes_read(p_load_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_updated_count integer;
begin
  select org_id into v_org_id
  from profiles
  where id = auth.uid();

  if v_org_id is null then
    raise exception 'Not authenticated';
  end if;

  update load_notes
  set is_read = true
  where load_id = p_load_id
    and org_id = v_org_id
    and author_type = 'driver'
    and is_read = false;

  get diagnostics v_updated_count = row_count;
  return v_updated_count;
end;
$$;

grant execute on function mark_load_notes_read(uuid) to authenticated;
