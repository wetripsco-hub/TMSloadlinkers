begin;

-- 1. NOTIFICATIONS LEDGER (Email Idempotency)
create table if not exists notifications_sent (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  template    text not null,
  recipient   citext not null,
  sent_at     timestamptz not null default now(),
  constraint one_send_per_template unique (org_id, template)
);

alter table notifications_sent enable row level security;

-- 2. INVITE ACCEPTANCE ATTRIBUTION
alter table invitations
  add column if not exists accepted_by uuid references profiles(id) on delete set null;

-- 3. CUSTOM ACCESS TOKEN HOOK (Injects org_id & org_role into JWT)
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  claims    jsonb;
  v_org_id  uuid;
  v_role    text;
begin
  select p.org_id, p.role::text
    into v_org_id, v_role
  from profiles p
  where p.id = (event->>'user_id')::uuid;

  claims := event->'claims';

  if v_org_id is not null then
    claims := jsonb_set(claims, '{org_id}', to_jsonb(v_org_id::text));
    claims := jsonb_set(claims, '{org_role}', to_jsonb(v_role));
  else
    claims := jsonb_set(claims, '{org_id}', 'null'::jsonb);
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
grant select on table profiles to supabase_auth_admin;

drop policy if exists "auth admin reads profiles for token hook" on profiles;
create policy "auth admin reads profiles for token hook"
  on profiles for select
  to supabase_auth_admin
  using (true);

commit;