-- =====================================================================
-- 043_normalize_fmcsa_lookup_cache_identifiers.sql
--
-- fmcsa_lookup_cache rows were stored with untrimmed whitespace (confirmed
-- live: a dot_number stored as "4468959 "), because previewCarrierVerification
-- (app/(dashboard)/carriers/actions.ts) read raw, unvalidated values straight
-- off the onboard dialog's react-hook-form getValues() rather than a
-- submitted/trimmed form value. Application code now normalizes mc_number
-- and dot_number (trim + strip non-digit characters) before every cache
-- read/write -- see normalizeCarrierIdentifier in
-- lib/services/carrier-verification.ts. This backfills the handful of rows
-- written before that fix so every stored key is already in the same
-- normalized form the app now looks up by.
-- =====================================================================

begin;

update fmcsa_lookup_cache
set dot_number = nullif(regexp_replace(trim(dot_number), '\D', '', 'g'), '')
where dot_number is not null
  and dot_number <> regexp_replace(trim(dot_number), '\D', '', 'g');

update fmcsa_lookup_cache
set mc_number = nullif(regexp_replace(trim(mc_number), '\D', '', 'g'), '')
where mc_number is not null
  and mc_number <> regexp_replace(trim(mc_number), '\D', '', 'g');

commit;
