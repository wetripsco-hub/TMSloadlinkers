-- 036_organization_bank_details.sql
-- Adds bank & remittance fields (bank_name, routing_number, account_number, remittance_notes)
-- and broker authority numbers (mc_number, dot_number) to the organizations table.

begin;

alter table organizations
  add column if not exists bank_name text,
  add column if not exists routing_number text,
  add column if not exists account_number text,
  add column if not exists remittance_notes text,
  add column if not exists mc_number text,
  add column if not exists dot_number text;

commit;
