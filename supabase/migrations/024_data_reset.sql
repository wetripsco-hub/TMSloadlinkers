-- 024_data_reset.sql
-- Tenant-initiated, platform-admin-approved destructive data reset.
-- data_reset_requests as specified in docs/PHASE_8_PLATFORM_ADMIN.md
-- section 1.1, plus the three state-transition functions that own every
-- write to this table -- there is deliberately no direct client UPDATE
-- policy on data_reset_requests. All three transitions (OTP verify,
-- approve, reject) and the destructive execute itself are SECURITY
-- DEFINER, so the otp_code_hash column is never read back across the
-- client boundary at all: the client submits a code, the function alone
-- decides whether it matches.
--
-- execute_data_reset() re-checks status = 'approved' and email_verified_at
-- is not null itself, even though approve_data_reset_request() calls it
-- immediately after setting status = 'approved' in the same transaction --
-- the requirement is "never without both conditions true at execution
-- time", not "trust the caller already checked".

begin;

create table data_reset_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id),
  requested_by uuid not null references auth.users (id),
  requested_at timestamptz not null default now(),
  otp_code_hash text,
  email_verified_at timestamptz,
  status text not null default 'pending_email'
    check (status in ('pending_email', 'pending_approval', 'approved', 'rejected', 'completed')),
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  rejection_reason text
);

create index data_reset_requests_org_id_idx on data_reset_requests (org_id);
create index data_reset_requests_status_idx on data_reset_requests (status);

alter table data_reset_requests enable row level security;

-- Tenant: org admin/owner only (is_org_admin(), 020_org_settings.sql) can
-- see or start a reset for their own org -- requesting a full data wipe
-- is not a rank-and-file member action.
create policy "data_reset_requests_select_tenant"
  on data_reset_requests for select
  using (
    org_id = public.get_auth_user_org_id()
    or public.is_platform_admin(auth.uid())
  );

create policy "data_reset_requests_insert_tenant"
  on data_reset_requests for insert
  with check (
    org_id = public.get_auth_user_org_id()
    and requested_by = auth.uid()
    and public.is_org_admin()
  );

-- No update/delete policy for anyone: every status transition below goes
-- through a SECURITY DEFINER function instead.

-- ---------------------------------------------------------------------
-- verify_data_reset_otp: pending_email -> pending_approval
-- ---------------------------------------------------------------------
create or replace function public.verify_data_reset_otp(p_request_id uuid, p_code text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request data_reset_requests;
begin
  select * into v_request from data_reset_requests where id = p_request_id;

  if v_request is null then
    raise exception 'Reset request not found';
  end if;

  if v_request.org_id != public.get_auth_user_org_id() then
    raise exception 'Not authorized for this reset request';
  end if;

  if v_request.status != 'pending_email' then
    return false;
  end if;

  if v_request.requested_at < now() - interval '10 minutes' then
    return false;
  end if;

  if v_request.otp_code_hash is distinct from encode(extensions.digest(p_code, 'sha256'), 'hex') then
    return false;
  end if;

  update data_reset_requests
  set email_verified_at = now(), status = 'pending_approval'
  where id = p_request_id;

  return true;
end;
$$;

revoke all on function public.verify_data_reset_otp(uuid, text) from public;
grant execute on function public.verify_data_reset_otp(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- execute_data_reset: the destructive wipe itself
-- ---------------------------------------------------------------------
create or replace function public.execute_data_reset(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request data_reset_requests;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'Only platform admins may execute a data reset';
  end if;

  select * into v_request from data_reset_requests where id = request_id;

  if v_request is null then
    raise exception 'Reset request not found';
  end if;

  if v_request.status != 'approved' or v_request.email_verified_at is null then
    raise exception 'Reset request is not approved and email-verified';
  end if;

  delete from invoices where org_id = v_request.org_id;
  delete from load_documents where org_id = v_request.org_id;
  delete from loads where org_id = v_request.org_id;
  delete from carriers where org_id = v_request.org_id;
  delete from customers where org_id = v_request.org_id;
  -- Last: also wipes the audit_events rows the deletes above just
  -- generated via record_audit_event() (004_audit.sql).
  delete from audit_events where org_id = v_request.org_id;

  update data_reset_requests set status = 'completed' where id = request_id;

  insert into platform_audit_log (actor_admin_id, action, org_id, after_json)
  values (auth.uid(), 'data_reset_executed', v_request.org_id, jsonb_build_object('request_id', request_id));
end;
$$;

revoke all on function public.execute_data_reset(uuid) from public;
grant execute on function public.execute_data_reset(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- approve_data_reset_request: pending_approval -> approved, then execute
-- ---------------------------------------------------------------------
create or replace function public.approve_data_reset_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'Only platform admins may approve a reset request';
  end if;

  select status into v_status from data_reset_requests where id = p_request_id;

  if v_status is null then
    raise exception 'Reset request not found';
  end if;

  if v_status != 'pending_approval' then
    raise exception 'Reset request is not awaiting approval';
  end if;

  update data_reset_requests
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_request_id;

  perform public.execute_data_reset(p_request_id);
end;
$$;

revoke all on function public.approve_data_reset_request(uuid) from public;
grant execute on function public.approve_data_reset_request(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- reject_data_reset_request: pending_approval -> rejected
-- ---------------------------------------------------------------------
create or replace function public.reject_data_reset_request(p_request_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'Only platform admins may reject a reset request';
  end if;

  select status into v_status from data_reset_requests where id = p_request_id;

  if v_status is null then
    raise exception 'Reset request not found';
  end if;

  if v_status != 'pending_approval' then
    raise exception 'Reset request is not awaiting approval';
  end if;

  update data_reset_requests
  set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), rejection_reason = p_reason
  where id = p_request_id;
end;
$$;

revoke all on function public.reject_data_reset_request(uuid, text) from public;
grant execute on function public.reject_data_reset_request(uuid, text) to authenticated;

commit;
