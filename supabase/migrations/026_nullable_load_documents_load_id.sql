-- =====================================================================
-- 026_nullable_load_documents_load_id.sql
--
-- Enables uploading a document (e.g. a RateCon) before a load exists yet,
-- so a load can later be created from its OCR extraction. load_documents
-- rows are org-scoped by their own org_id column (not by a join through
-- loads), and the load-documents storage bucket's RLS policies only check
-- the org_id path segment, so dropping this NOT NULL constraint is safe
-- for both table-level and storage-level tenant isolation -- an
-- unassigned document is still fully scoped and readable/writable by its
-- own org, just not yet attached to a load.
-- =====================================================================

begin;

alter table load_documents alter column load_id drop not null;

commit;
