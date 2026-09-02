-- 008_load_documents_storage.sql
-- Adds OCR result columns to load_documents and provisions the private
-- 'load-documents' storage bucket with org-scoped RLS. Objects are expected
-- to be keyed as `${org_id}/${load_id}/${filename}` so policies can check
-- tenancy from the first path segment without a join.

alter table load_documents
  add column ocr_confidence_score numeric(5, 2),
  add column ocr_extracted_json jsonb;

-- The original check constraint only allowed pending/processing/completed/
-- failed; the domain OcrStatus type also has 'review_required'.
alter table load_documents drop constraint load_documents_ocr_status_check;
alter table load_documents add constraint load_documents_ocr_status_check
  check (ocr_status in ('pending', 'processing', 'completed', 'failed', 'review_required'));

insert into storage.buckets (id, name, public)
values ('load-documents', 'load-documents', false)
on conflict (id) do nothing;

create policy "load_documents_storage_select_own_org"
  on storage.objects for select
  using (
    bucket_id = 'load-documents'
    and (storage.foldername(name))[1] = (
      select org_id::text from profiles where profiles.id = auth.uid()
    )
  );

create policy "load_documents_storage_insert_own_org"
  on storage.objects for insert
  with check (
    bucket_id = 'load-documents'
    and (storage.foldername(name))[1] = (
      select org_id::text from profiles where profiles.id = auth.uid()
    )
  );

create policy "load_documents_storage_delete_own_org"
  on storage.objects for delete
  using (
    bucket_id = 'load-documents'
    and (storage.foldername(name))[1] = (
      select org_id::text from profiles where profiles.id = auth.uid()
    )
  );
