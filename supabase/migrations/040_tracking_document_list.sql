-- 040_tracking_document_list.sql
-- Lets the public /track/[token] Documents tab list what's already been
-- uploaded for that one load, without authentication.
--
-- Same shape as resolve_load_for_tracking_upload (039_tracking_pod_upload.sql):
-- read-only, security definer, resolves strictly from the token via a join
-- through loads.tracking_token -- a caller can never list another load's
-- documents. Deliberately does not return file_url (the storage object
-- path): this is metadata-only per the current design (no per-document
-- signed URLs yet), and there is no anon storage read policy on the
-- load-documents bucket for that path to be useful to the caller anyway.
create or replace function list_tracking_documents(p_token uuid)
returns table (
  id uuid,
  document_type text,
  ocr_status text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select d.id, d.document_type, d.ocr_status, d.created_at
  from load_documents d
  join loads l on l.id = d.load_id
  where l.tracking_token = p_token
  order by d.created_at desc;
$$;

grant execute on function list_tracking_documents(uuid) to anon, authenticated;
