-- 050_load_notes.sql
-- load_notes: a per-load timeline of short text notes, either staff-authored
-- (dispatcher/broker, via the load detail page) or driver-authored (via the
-- public /track/[token] page, no auth session).
--
-- RLS covers only the staff path: org-scoped SELECT/INSERT for authenticated
-- users, INSERT restricted to author_type = 'staff' with author_user_id
-- pinned to auth.uid() (mirrors profiles_update_own_row's shape from
-- 001_foundation.sql -- a row can't be inserted claiming to be someone
-- else). There is deliberately no RLS path for driver-authored rows: same
-- security model as every other tracking-token write in this codebase
-- (record_tracking_ping, advance_tracking_status, resolve_load_for_tracking_
-- upload) -- an unauthenticated caller has no auth.uid() to check against,
-- so the write goes through add_driver_load_note(), a SECURITY DEFINER
-- function that resolves identity from the token itself, not through a
-- table policy.

create table load_notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  load_id uuid not null references loads (id) on delete cascade,
  author_type text not null check (author_type in ('staff', 'driver')),
  author_user_id uuid references profiles (id) on delete set null,
  author_label text not null,
  note_text text not null check (char_length(note_text) <= 500),
  is_read boolean not null default true,
  created_at timestamptz not null default now()
);

create index load_notes_load_id_created_at_idx on load_notes (load_id, created_at);

alter table load_notes enable row level security;

create policy "load_notes_select_own_org"
  on load_notes for select
  to authenticated
  using (org_id = public.get_auth_user_org_id());

create policy "load_notes_insert_staff_own_org"
  on load_notes for insert
  to authenticated
  with check (
    org_id = public.get_auth_user_org_id()
    and author_type = 'staff'
    and author_user_id = auth.uid()
  );

-- ---------------------------------------------------------------------
-- add_driver_load_note: public, token-scoped note submission.
--
-- Mirrors resolve_load_for_tracking_upload's token-resolution shape
-- (039_tracking_pod_upload.sql) and advance_tracking_status's error
-- convention (037_tracking_checkin.sql): plain `raise exception` with a
-- distinct message per failure reason, since every RPC in this tracking
-- family reports failure that way (no dedicated error-code column/type
-- exists), and callers classify by matching on the message text.
--
-- Rate limiting: neither resolve_load_for_tracking_upload nor
-- advance_tracking_status/record_tracking_ping has any rate-limit logic in
-- their SQL bodies. The only existing rate limit anywhere in the tracking
-- flow lives in app/actions/upload-tracking-document.ts (the POD upload
-- server action): after resolving the token, it counts load_documents rows
-- for that load created in the last hour via the service-role client, and
-- rejects once that count reaches 10 -- a plain count-in-a-trailing-window
-- check, not a token bucket or a dedicated counter table (that heavier
-- pattern exists separately, for OCR quota, in check_and_increment_ocr_
-- quota() / 019_ocr_rate_limiting.sql, but that is a per-org-per-day quota
-- for a different feature, not something this reuses).
--
-- This function must do its own check+insert in one SQL statement (there is
-- no app-layer step in between for driver note submission, unlike the POD
-- upload flow), so the same count-in-a-trailing-window technique is
-- reimplemented here directly in plpgsql rather than left in TypeScript:
-- count this load's driver-authored notes created in the last 30 seconds,
-- reject if any exist. 30 seconds (one note per load per window, not 10/
-- hour) rather than mirroring the POD upload's exact 10/hour number, since
-- a short text note is much cheaper to send than a photo upload and a
-- dispatcher-facing "driver sent an update" timeline is more useful with a
-- short cooldown than an hourly cap.
create or replace function add_driver_load_note(p_token uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_load_id uuid;
  v_org_id uuid;
  v_driver_name text;
  v_trimmed_note text;
  v_recent_count integer;
begin
  v_trimmed_note := trim(p_note);

  if v_trimmed_note = '' then
    raise exception 'Note cannot be empty';
  end if;

  if char_length(v_trimmed_note) > 500 then
    raise exception 'Note must be 500 characters or fewer';
  end if;

  select id, org_id, driver_name into v_load_id, v_org_id, v_driver_name
  from loads
  where tracking_token = p_token;

  if v_load_id is null then
    raise exception 'Invalid tracking token';
  end if;

  select count(*) into v_recent_count
  from load_notes
  where load_id = v_load_id
    and author_type = 'driver'
    and created_at >= now() - interval '30 seconds';

  if v_recent_count > 0 then
    raise exception 'Please wait a moment before sending another update';
  end if;

  insert into load_notes (org_id, load_id, author_type, author_label, note_text, is_read)
  values (v_org_id, v_load_id, 'driver', coalesce(v_driver_name, 'Driver'), v_trimmed_note, false);
end;
$$;

grant execute on function add_driver_load_note(uuid, text) to anon, authenticated;
