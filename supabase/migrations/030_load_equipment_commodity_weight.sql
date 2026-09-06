-- =====================================================================
-- 030_load_equipment_commodity_weight.sql
--
-- loads.ts has hardcoded equipmentType: "", commodity: null, weightLbs:
-- null since these were never real columns (see that file's header
-- comment). This adds them, nullable, so the existing load wizard (which
-- never sends these fields) keeps working unchanged -- only new callers
-- that explicitly pass them (e.g. the RateCon review flow) populate them.
-- =====================================================================

begin;

alter table loads
  add column equipment_type text null,
  add column commodity text null,
  add column weight_lbs numeric null;

commit;
