-- 075_granular_roles_and_cancel_reason.sql
--
-- Two additive, non-breaking changes:
--
-- 1. Extends user_role_type with granular operational roles so application
--    code can distinguish broker-agent from read-only accountant without
--    relying on the coarse owner/admin/member/viewer split.  Existing rows
--    keep their current values; no data migration is needed.
--
-- 2. Adds cancel_reason to loads.  When an operator cancels a load the
--    reason is stored here alongside the status = 'cancelled' update so the
--    existing loads_audit trigger captures it in after_json automatically --
--    no separate audit insert is required.

-- 1. New role values ---------------------------------------------------------
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block, so each
-- statement is issued individually outside any explicit BEGIN/COMMIT.

alter type user_role_type add value if not exists 'org_admin';
alter type user_role_type add value if not exists 'broker_agent';
alter type user_role_type add value if not exists 'dispatcher_agent';
alter type user_role_type add value if not exists 'accountant';
alter type user_role_type add value if not exists 'read_only_viewer';

-- 2. Cancel reason -----------------------------------------------------------
alter table loads add column if not exists cancel_reason text null;

comment on column loads.cancel_reason is
  'Free-text reason captured when an operator sets status = cancelled. '
  'Automatically recorded in audit_events.after_json by the loads_audit trigger.';
