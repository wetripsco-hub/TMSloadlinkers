-- =====================================================================
-- 031_load_customer_po_number.sql
--
-- Adds a matchable field for bulk POD auto-linking: PodExtraction.poNumber
-- (OCR-extracted) needs something on the load side to compare against.
-- Nullable, so the existing load wizard (which doesn't collect this yet)
-- keeps working unchanged.
-- =====================================================================

begin;

alter table loads add column customer_po_number text null;

commit;
