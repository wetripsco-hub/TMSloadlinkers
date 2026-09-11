-- =====================================================================
-- 042_fix_fmcsa_lookup_cache_upsert.sql
--
-- Fixes fmcsa_lookup_cache never actually getting written to: 041 gave
-- mc_number/dot_number PARTIAL unique indexes (`where ... is not null`).
-- Postgres's ON CONFLICT target inference does not match a partial index
-- unless the INSERT's ON CONFLICT clause repeats the same predicate --
-- and supabase-js's `.upsert(data, { onConflict: 'dot_number' })`
-- (lib/services/carrier-verification.ts, FmcsaLookupCacheStore.upsert) has
-- no way to express that predicate. Every real upsert therefore failed
-- with 42P10 ("there is no unique or exclusion constraint matching the ON
-- CONFLICT specification"), silently swallowed by verify()'s
-- graceful-degradation catch (which does log it -- this just went
-- unnoticed).
--
-- A plain (non-partial) UNIQUE constraint gives the same "one row per
-- non-null MC/DOT number, any number of rows with a null in that column"
-- behavior we actually wanted -- Postgres never considers two NULLs equal
-- for uniqueness -- while also being a real target ON CONFLICT can infer
-- against with no predicate needed. So swap the partial indexes for plain
-- unique constraints; upsert() itself needs no code change.
-- =====================================================================

begin;

drop index if exists fmcsa_lookup_cache_mc_number_key;
drop index if exists fmcsa_lookup_cache_dot_number_key;

alter table fmcsa_lookup_cache
  add constraint fmcsa_lookup_cache_mc_number_key unique (mc_number);

alter table fmcsa_lookup_cache
  add constraint fmcsa_lookup_cache_dot_number_key unique (dot_number);

commit;
