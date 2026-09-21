-- 048_carriers_org_mc_number_unique.sql
-- Prevent the duplicate-carrier bug found live: seedDemoDataForCurrentOrg()
-- had no existence check and could be (and was) invoked multiple times
-- against the same org, inserting the same 4 named carriers repeatedly
-- (org 29a4426b-ca83-4cbe-a409-a6ae238fff48 had 3 rows each for 4 carrier
-- names before being merged down to 1 canonical row each in this same
-- migration set -- see the accompanying data fix, not part of this file).
--
-- Checked first: no other org in the live DB has two carriers sharing an
-- mc_number (confirmed via
-- `select org_id, mc_number, count(*) from carriers where mc_number is not
-- null group by org_id, mc_number having count(*) > 1` -- zero rows after
-- the merge), so this is safe to apply without further data cleanup.
--
-- NULLs are unaffected: Postgres unique constraints don't consider NULL
-- equal to NULL, so carriers onboarded without an MC number are unaffected
-- and multiple such rows per org remain allowed.
alter table carriers
  add constraint carriers_org_id_mc_number_key unique (org_id, mc_number);
