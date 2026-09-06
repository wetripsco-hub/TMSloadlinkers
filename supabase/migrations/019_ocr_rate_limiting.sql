-- =====================================================================
-- 019_ocr_rate_limiting.sql
-- Phase 4 / Task P4-T4 prep
--
-- Yeh migration OCR ke liye daily rate limiting ka database hissa banata
-- hai (Edge Function abhi tak nahi banai gayi -- sirf schema yahan hai):
--   * plan_ocr_daily_limits      -- har plan tier ka daily OCR quota
--   * ocr_usage_daily            -- har org ka roz ka OCR usage counter
--   * check_and_increment_ocr_quota() -- atomic "check + increment" RPC
--   * load_documents.ocr_error / ocr_attempts -- retry tracking ke liye
--
-- IMPORTANT -- security definer aur search_path:
--   012_billing_and_teams.sql aur 011_fix_rls_recursion.sql ki tarah, yahan
--   bhi har helper function SECURITY DEFINER hai aur search_path pinned
--   hai, taake yeh apni source tables RLS ko dobara trigger kiye baghair
--   parh sake.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. PLAN_OCR_DAILY_LIMITS
--
-- Har subscription plan tier ka roz ka OCR limit yahan set hai.
-- daily_limit = null ka matlab hai "unlimited" (jaise enterprise plan).
-- ---------------------------------------------------------------------
create table if not exists plan_ocr_daily_limits (
  plan         subscription_plan_tier primary key,
  daily_limit  integer  -- null = unlimited, warna yeh number roz ka max hai
);

comment on table plan_ocr_daily_limits is
  'Per-plan daily OCR quota. daily_limit null means unlimited for that plan.';
comment on column plan_ocr_daily_limits.daily_limit is
  'Max OCR calls allowed per org per UTC day. Null = no limit.';

-- Seed values: agar row pehle se hai to usko chhedo mat (existing values
-- kisi ne manually badli ho sakti hain), sirf missing plans insert karo.
insert into plan_ocr_daily_limits (plan, daily_limit)
values
  ('free', 5),
  ('starter', 5),
  ('growth', 50),
  ('enterprise', null)
on conflict (plan) do nothing;

-- ---------------------------------------------------------------------
-- 2. OCR_USAGE_DAILY
--
-- Har org ka, har din ka OCR usage counter. Yeh table sirf
-- check_and_increment_ocr_quota() (neeche) aur service role likhte hain --
-- client seedha insert/update/delete nahi kar sakta, warna koi bhi apna
-- counter reset ya cheat kar sakta.
-- ---------------------------------------------------------------------
create table if not exists ocr_usage_daily (
  org_id      uuid not null references organizations(id) on delete cascade,
  usage_date  date not null default (now() at time zone 'utc')::date,
  count       integer not null default 0,
  primary key (org_id, usage_date)
);

comment on table ocr_usage_daily is
  'One row per org per UTC day, tracking how many OCR calls that org made. Written only by check_and_increment_ocr_quota() (security definer) and the service role.';

create index if not exists idx_ocr_usage_daily_org
  on ocr_usage_daily (org_id, usage_date desc);

alter table ocr_usage_daily enable row level security;

-- Client sirf apne org ka usage dekh sakta hai (jaise ek "aaj kitna use
-- kiya" UI banana ho to). Insert/update/delete ke liye koi policy nahi --
-- RLS on + zero write policy = client kabhi bhi likh nahi sakta, sirf
-- SECURITY DEFINER function ya service role hi likh sakte hain.
drop policy if exists "ocr_usage_daily_select_own_org" on ocr_usage_daily;
create policy "ocr_usage_daily_select_own_org"
  on ocr_usage_daily for select
  to authenticated
  using (org_id = public.get_auth_user_org_id());

-- ---------------------------------------------------------------------
-- 3. CHECK_AND_INCREMENT_OCR_QUOTA()
--
-- Yeh function ek hi call mein "check karo aur agar allowed hai to
-- increment bhi kar do" karta hai -- atomically, taake do parallel OCR
-- requests race condition se dono "allowed: true" na ban jayein jab
-- sirf ek hi baaki quota bacha ho.
--
-- Return shape: { "allowed": bool, "used": int, "limit": int|null }
-- ---------------------------------------------------------------------
create or replace function public.check_and_increment_ocr_quota(p_org_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_today       date := (now() at time zone 'utc')::date;
  v_plan        subscription_plan_tier;
  v_daily_limit integer;
  v_new_count   integer;
  v_rows        integer;
begin
  -- Step 1: org ka current plan subscriptions table se nikalo
  -- (012_billing_and_teams.sql). Har org ka bas ek hi row hota hai.
  select plan into v_plan
  from subscriptions
  where org_id = p_org_id;

  -- EDGE CASE: agar subscriptions mein org ka row hi nahi mila (ho sakta
  -- hai webhook abhi fire nahi hua, ya data kisi wajah se missing ho), to
  -- hum sabse restrictive limit maan lete hain -- free plan jaisa 5/day --
  -- taake koi bhi unverified org unlimited OCR na chala sake.
  if v_plan is null then
    v_daily_limit := 5;
  else
    select daily_limit into v_daily_limit
    from plan_ocr_daily_limits
    where plan = v_plan;
  end if;

  -- Unlimited plan (jaise enterprise, daily_limit null): hamesha allow
  -- karo, magar usage phir bhi ginte raho -- aage chal kar reporting aur
  -- visibility ke kaam aayega.
  if v_daily_limit is null then
    insert into ocr_usage_daily (org_id, usage_date, count)
    values (p_org_id, v_today, 1)
    on conflict (org_id, usage_date)
    do update set count = ocr_usage_daily.count + 1
    returning count into v_new_count;

    return jsonb_build_object('allowed', true, 'used', v_new_count, 'limit', null);
  end if;

  -- Pehle confirm karo ke aaj ka row exist karta hai (agar din ka pehla
  -- request hai to count 0 se shuru). "do nothing" isliye taake concurrent
  -- requests ek dusre se race na karein is insert par.
  insert into ocr_usage_daily (org_id, usage_date, count)
  values (p_org_id, v_today, 0)
  on conflict (org_id, usage_date) do nothing;

  -- Ab atomic guarded increment: UPDATE khud row-level lock leta hai, is
  -- liye do parallel requests kabhi ek saath "count < limit" true nahi
  -- dekhenge -- dusra request pehle wale ke commit hone ka wait karega
  -- aur phir updated count ke sath dobara check karega.
  update ocr_usage_daily
  set count = count + 1
  where org_id = p_org_id
    and usage_date = v_today
    and count < v_daily_limit
  returning count into v_new_count;

  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    -- Quota khatam ho chuki hai, increment nahi hua. Sirf current count
    -- wapas bhej do taake caller ko pata chale kitna use ho chuka hai.
    select count into v_new_count
    from ocr_usage_daily
    where org_id = p_org_id and usage_date = v_today;

    return jsonb_build_object('allowed', false, 'used', v_new_count, 'limit', v_daily_limit);
  end if;

  return jsonb_build_object('allowed', true, 'used', v_new_count, 'limit', v_daily_limit);
end;
$$;

comment on function public.check_and_increment_ocr_quota is
  'Atomically checks and increments an org''s daily OCR usage. Called only by the ocr-extract Edge Function via the service role, never directly by clients.';

-- Client kabhi bhi is function ko seedha call nahi kar sakta -- sirf
-- ocr-extract Edge Function apni service role key ke sath karti hai.
-- Service role Postgres RLS/grants ko bypass karta hai, is liye usko
-- alag se grant dene ki zaroorat nahi.
revoke all on function public.check_and_increment_ocr_quota(uuid) from public;
revoke all on function public.check_and_increment_ocr_quota(uuid) from anon;
revoke all on function public.check_and_increment_ocr_quota(uuid) from authenticated;

-- ---------------------------------------------------------------------
-- 4. LOAD_DOCUMENTS -- retry tracking columns
--
-- OCR call fail ho sakti hai (timeout, provider error, waghera). Yeh do
-- columns future Edge Function ko batayenge ke kitni baar try ho chuka
-- hai aur aakhri error kya tha, taake retry logic aur UI dono ismein se
-- padh sakein.
-- ---------------------------------------------------------------------
alter table load_documents
  add column if not exists ocr_error text,
  add column if not exists ocr_attempts integer not null default 0;

comment on column load_documents.ocr_error is
  'Last OCR failure message, if any. Null when the most recent attempt did not fail.';
comment on column load_documents.ocr_attempts is
  'How many times OCR extraction has been attempted for this document.';

commit;
