-- 072_notification_rpcs.sql
-- Two SECURITY DEFINER write paths into notifications (071_notifications.sql),
-- matching this schema's existing convention for writes that need to bypass
-- ordinary RLS (mark_load_notes_read, start_platform_admin_preview, etc.)
-- instead of routing app code through the service-role key:
--
-- sync_system_alert_notifications(): re-derives org_id from the caller's
-- own session (public.get_auth_user_org_id(), same as mark_load_notes_read)
-- rather than trusting a client-supplied org id, so any authenticated
-- tenant user can safely call it for their own org only. Mirrors the same
-- four conditions v_exceptions (046/055/058) computes, and relies on
-- notifications_org_source_entity_uidx's partial unique index for the
-- "don't duplicate an alert that's already there" requirement.
--
-- send_admin_notification(): the super-admin -> tenant messaging path.
-- Gated on is_platform_admin(auth.uid()) exactly like every other
-- platform-admin RPC in this schema (021_platform_admin.sql).

begin;

create or replace function public.sync_system_alert_notifications()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org_id uuid;
  v_count integer := 0;
begin
  v_org_id := public.get_auth_user_org_id();
  if v_org_id is null then
    return 0;
  end if;

  with candidates as (
    select
      'missing_carrier' as source,
      id as entity_id,
      'Load missing a carrier' as title,
      'Load ' || coalesce(load_number, id::text) || ' is in progress but has no carrier assigned.' as body,
      '/loads/' || id as link_url
    from loads
    where org_id = v_org_id
      and status in ('covered', 'dispatched', 'at_pickup', 'in_transit', 'at_delivery')
      and carrier_id is null

    union all

    select
      'pod_pending',
      l.id,
      'POD pending review',
      'Load ' || coalesce(l.load_number, l.id::text) || ' was delivered but its POD/BOL hasn''t been reviewed yet.',
      '/loads/' || l.id
    from loads l
    where l.org_id = v_org_id
      and l.status = 'delivered'
      and not exists (
        select 1 from load_documents ld
        where ld.load_id = l.id
          and ld.document_type in ('POD', 'BOL')
          and ld.ocr_status = 'completed'
      )

    union all

    select
      'expired_insurance',
      id,
      'Carrier insurance expired',
      name || '''s insurance expired on ' || insurance_expiry_date::text || '.',
      '/carriers/' || id
    from carriers
    where org_id = v_org_id
      and insurance_expiry_date is not null
      and insurance_expiry_date < current_date

    union all

    select
      'expiring_insurance',
      id,
      'Carrier insurance expiring soon',
      name || '''s insurance expires on ' || insurance_expiry_date::text || '.',
      '/carriers/' || id
    from carriers
    where org_id = v_org_id
      and is_blacklisted = false
      and insurance_expiry_date is not null
      and insurance_expiry_date >= current_date
      and insurance_expiry_date <= current_date + 30
  )
  insert into notifications (org_id, recipient_user_id, title, body, notification_type, source, entity_id, link_url)
  select v_org_id, null, title, body, 'system_alert', source, entity_id, link_url
  from candidates
  on conflict (org_id, source, entity_id) where entity_id is not null do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.sync_system_alert_notifications() from public;
grant execute on function public.sync_system_alert_notifications() to authenticated;

create or replace function public.send_admin_notification(
  p_target_type text,
  p_target_org_id uuid,
  p_target_user_id uuid,
  p_title text,
  p_body text
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org_id uuid;
  v_count integer := 0;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'Only platform admins may send admin notifications';
  end if;

  if p_title is null or btrim(p_title) = '' then
    raise exception 'Title is required';
  end if;
  if p_body is null or btrim(p_body) = '' then
    raise exception 'Body is required';
  end if;
  if p_target_type not in ('org', 'user', 'all') then
    raise exception 'Invalid target type: %', p_target_type;
  end if;

  if p_target_type = 'org' then
    if p_target_org_id is null then
      raise exception 'Target organization is required';
    end if;

    insert into notifications (org_id, recipient_user_id, title, body, notification_type, source)
    values (p_target_org_id, null, btrim(p_title), btrim(p_body), 'admin_message', 'super_admin');
    v_count := 1;

  elsif p_target_type = 'user' then
    if p_target_user_id is null then
      raise exception 'Target user is required';
    end if;

    select org_id into v_org_id from profiles where id = p_target_user_id;
    if v_org_id is null then
      raise exception 'Target user has no organization';
    end if;

    insert into notifications (org_id, recipient_user_id, title, body, notification_type, source)
    values (v_org_id, p_target_user_id, btrim(p_title), btrim(p_body), 'admin_message', 'super_admin');
    v_count := 1;

  else
    insert into notifications (org_id, recipient_user_id, title, body, notification_type, source)
    select id, null, btrim(p_title), btrim(p_body), 'admin_message', 'super_admin'
    from organizations;
    get diagnostics v_count = row_count;
  end if;

  return v_count;
end;
$$;

revoke all on function public.send_admin_notification(text, uuid, uuid, text, text) from public;
grant execute on function public.send_admin_notification(text, uuid, uuid, text, text) to authenticated;

commit;
