// Shared between previewCarrierVerification (app/(dashboard)/carriers/actions.ts)
// and CarrierOnboardDialog so both agree on how to mark "no real FMCSA check
// happened" (missing FMCSA_WEB_KEY or an API failure) distinctly from a real
// CarrierVerificationResult, instead of ever presenting a synthesized
// "checked and found bad" result. Deliberately has no other imports so the
// client-side dialog can use it without pulling in
// lib/services/carrier-verification.ts, which depends on the server-only
// Supabase service client.
export const VERIFICATION_UNAVAILABLE_PREFIX = "Verification unavailable";
