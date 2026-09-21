-- 047_carrier_verification_columns.sql
-- Persist FMCSA verification results on carriers instead of discarding them
-- after the onboarding dialog closes (previewCarrierVerification's result
-- was never written anywhere before this).
--
-- Column choices, based on real FMCSA QCMobile payloads in
-- fmcsa_lookup_cache.response_json (not assumed):
-- - authority_status: the raw `content.carrier.statusCode` field. Live
--   examples seen: "A" (active) and "I" (inactive) -- these are genuinely
--   different carriers, so this is a real, meaningful signal, not a
--   boolean. Nullable: unset until a carrier is actually verified.
-- - safety_rating: CarrierVerificationResult.safetyRating
--   ("Satisfactory"/"Conditional"/"Unsatisfactory"/"None").
-- - out_of_service_date: CarrierVerificationResult.outOfServiceDate.
-- - last_verified_at: when this data was actually fetched from FMCSA
--   (CarrierVerificationResult.fetchedAt), updated on every re-verification.
-- - verification_source: CarrierVerificationResult.source ("fmcsa"/"mock").
--
-- Deliberately NOT added here: insurance/blacklist columns. Those need a
-- manual-entry UI (FMCSA doesn't return insurance carrier/policy/coverage
-- details) and are a separate task. deriveComplianceBadge()'s
-- insurance-expiry ("expiring") branch stays inert until then.

alter table carriers
  add column authority_status text,
  add column safety_rating text,
  add column out_of_service_date date,
  add column last_verified_at timestamptz,
  add column verification_source text;
