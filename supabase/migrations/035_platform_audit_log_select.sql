-- 035_platform_audit_log_select.sql
-- Add SELECT policy on platform_audit_log so authorized platform admins
-- can view the platform audit log in the Super Admin Console.
begin;

create policy "platform_audit_log_select_platform_admin"
  on platform_audit_log for select
  using (public.is_platform_admin(auth.uid()));

commit;
