-- 051_list_load_notes_for_tracking.sql
-- Lets the public /track/[token] page read the full load_notes thread for
-- that one load (both author_type values -- driver's own messages and
-- staff replies), turning driver note submission into a real two-way
-- thread instead of write-only.
--
-- Same shape as list_tracking_documents (040_tracking_document_list.sql):
-- read-only, security definer, resolves strictly via a join through
-- loads.tracking_token -- a caller can never list another load's notes.
-- Adds read access only; add_driver_load_note (050_load_notes.sql) and its
-- 30-second cooldown/validation are untouched, as are load_notes' own RLS
-- policies (which still cover only the staff/authenticated path -- this
-- function is the anon-side read path, exactly like list_tracking_documents
-- is for load_documents).
create or replace function list_load_notes_for_tracking(p_token uuid)
returns table (
  id uuid,
  author_type text,
  author_label text,
  note_text text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select n.id, n.author_type, n.author_label, n.note_text, n.created_at
  from load_notes n
  join loads l on l.id = n.load_id
  where l.tracking_token = p_token
  order by n.created_at asc;
$$;

grant execute on function list_load_notes_for_tracking(uuid) to anon, authenticated;
