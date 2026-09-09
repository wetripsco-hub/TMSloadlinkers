-- 038_fix_audit_event_case.sql
-- record_audit_event() (004_audit.sql) compares tg_op against lowercase
-- literals, but Postgres always returns tg_op as 'INSERT'/'UPDATE'/'DELETE'.
-- Those case branches never matched, so before_json/after_json have been
-- null on every audit_events row since the table was created, on every
-- audited table (loads, invoices, carriers). The action column was
-- unaffected because it separately wraps tg_op in lower(). Wrapping the
-- before/after comparisons in lower() too, matching that existing pattern.

begin;

create or replace function record_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_events (
    org_id, actor_user_id, entity_type, entity_id, action, before_json, after_json
  )
  values (
    coalesce(new.org_id, old.org_id),
    auth.uid(),
    tg_table_name,
    coalesce(new.id, old.id),
    lower(tg_op),
    case when lower(tg_op) in ('update', 'delete') then to_jsonb(old) else null end,
    case when lower(tg_op) in ('insert', 'update') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

commit;

-- =====================================================================
-- VERIFICATION -- run by hand after applying, not part of the migration.
--
-- update loads set updated_at = now() where id = '<any load id>';
-- select before_json is not null as has_before, after_json is not null as has_after,
--        before_json->>'status' as before_status, after_json->>'status' as after_status
-- from audit_events
-- where entity_type = 'loads' and entity_id = '<same load id>'
-- order by created_at desc limit 1;
-- -- expect has_before = true, has_after = true, both status values populated
-- =====================================================================
