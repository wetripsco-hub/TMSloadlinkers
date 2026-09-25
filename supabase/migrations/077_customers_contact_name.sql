-- =====================================================================
-- 077_customers_contact_name.sql
--
-- Adds a "Contact Person" field to customers, separate from the company
-- name itself -- mirrors the contact_person_name pattern already used on
-- organizations (018_complete_onboarding.sql lineage).
-- =====================================================================

begin;

alter table customers add column if not exists contact_name text;

comment on column customers.contact_name is
  'The billing/dispatch point of contact at the shipper, separate from the company name itself.';

commit;
