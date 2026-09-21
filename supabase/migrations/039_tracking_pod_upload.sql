-- 039_tracking_pod_upload.sql
-- Lets a driver holding only a tracking_token upload a POD photo from the
-- public /track/[token] page, without authentication, scoped strictly to
-- that one load.
--
-- Mirrors advance_tracking_status (037_tracking_checkin.sql): the token is
-- the only identity an unauthenticated caller has, so it is resolved to
-- {load_id, org_id} server-side by this narrow security definer function --
-- the caller never supplies either id directly, so it can never target
-- another tenant's load. This function is read-only and returns IDs only;
-- it never touches storage.objects or load_documents itself. The actual
-- storage upload and load_documents insert happen in
-- app/actions/upload-tracking-document.ts using the service-role client
-- (same as every other privileged write in this codebase), after this
-- function has resolved the ids -- not via a new anon RLS policy on
-- storage.objects, which would have to validate a token from inside a
-- storage policy and is a much harder thing to reason about safely than a
-- single-purpose SQL function.
create or replace function resolve_load_for_tracking_upload(p_token uuid)
returns table (load_id uuid, org_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  select id, org_id
  from loads
  where tracking_token = p_token;
$$;

grant execute on function resolve_load_for_tracking_upload(uuid) to anon, authenticated;
