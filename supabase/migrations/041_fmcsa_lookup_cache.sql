-- =====================================================================
-- 041_fmcsa_lookup_cache.sql
--
-- Caches FMCSA QCMobile API responses (lib/services/carrier-verification.ts,
-- FmcsaCarrierVerificationProvider) so repeated MC/DOT auto-fill lookups
-- from the carrier onboarding dialog (previewCarrierVerification,
-- app/(dashboard)/carriers/actions.ts) don't re-hit the public FMCSA API
-- every time. Public registry data, not tenant-scoped -- no org_id, no
-- per-org RLS needed. Access is restricted to the service role only: RLS
-- is enabled with zero policies (same idiom as ocr_usage_daily in
-- 019_ocr_rate_limiting.sql), so anon/authenticated get no access at
-- all -- the server action is the sole access path, always via a
-- service-role client.
-- =====================================================================

begin;

create table if not exists fmcsa_lookup_cache (
  id            uuid primary key default gen_random_uuid(),
  mc_number     text,
  dot_number    text,
  response_json jsonb not null,
  fetched_at    timestamptz not null default now(),
  expires_at    timestamptz not null,
  constraint fmcsa_lookup_cache_identifier_check
    check (mc_number is not null or dot_number is not null)
);

comment on table fmcsa_lookup_cache is
  'Cached FMCSA QCMobile API responses, keyed by MC or DOT number. Service-role access only -- see FmcsaCarrierVerificationProvider in lib/services/carrier-verification.ts.';
comment on column fmcsa_lookup_cache.response_json is
  'Raw FMCSA API response payload (FmcsaCarrierResponse shape), cached as-is.';
comment on column fmcsa_lookup_cache.expires_at is
  'Cache freshness cutoff -- currently fetched_at + 7 days. A row past this is treated as a miss and re-fetched.';

-- One cached row per MC number, one per DOT number. Partial (where not
-- null) so rows sharing a null in the other column never collide; these
-- indexes double as the lookup path (WHERE mc_number = ... / WHERE
-- dot_number = ...).
create unique index if not exists fmcsa_lookup_cache_mc_number_key
  on fmcsa_lookup_cache (mc_number)
  where mc_number is not null;

create unique index if not exists fmcsa_lookup_cache_dot_number_key
  on fmcsa_lookup_cache (dot_number)
  where dot_number is not null;

-- RLS enabled, deliberately zero policies -- same idiom as ocr_usage_daily
-- (019_ocr_rate_limiting.sql): anon/authenticated get no access at all,
-- default-deny. Only the service role (which bypasses RLS) can read or
-- write this table.
alter table fmcsa_lookup_cache enable row level security;

commit;
