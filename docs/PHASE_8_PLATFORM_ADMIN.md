# PHASE 8 — Org Settings, Platform Admin, Support Tickets & Data Reset

**Client:** Loadlinkers Logistics
**Prerequisite:** Phase 7 (PLG launch) core signup/billing flow stable.
**Document status:** Implementation guide — save at `docs/PHASE_8_PLATFORM_ADMIN.md`

---

## Why this phase exists

Every feature built through Phase 7 is tenant-scoped: every query, every RLS policy, every table assumes the caller belongs to exactly one `org_id`. This phase introduces the first cross-tenant concern — a **platform admin role** that belongs to Loadlinkers itself, not to any tenant. Three of the four features in this phase (super-admin dashboard, support tickets, data-reset approval) depend on this role existing first. Build it before anything else in this phase.

The fourth feature (org settings — logo, contact info) is tenant-scoped like everything before it and has no dependency on the platform admin role, so it can be built in parallel or first.

---

## 1.1 New schema (reference)

```sql
-- organizations: extend existing table, do not recreate
alter table organizations
  add column contact_person_name text,
  add column logo_url text,
  add column address text,
  add column contact_email text,
  add column contact_phone text;

-- platform_admins: Loadlinkers internal staff only, no self-signup
create table platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
-- Rows inserted manually via SQL editor by you. No UI writes to this table, ever.

-- data_reset_requests
create table data_reset_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  requested_by uuid not null references auth.users(id),
  requested_at timestamptz not null default now(),
  otp_code_hash text,
  email_verified_at timestamptz,
  status text not null default 'pending_email'
    check (status in ('pending_email','pending_approval','approved','rejected','completed')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text
);

-- support_tickets
create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  created_by uuid not null references auth.users(id),
  subject text not null,
  description text not null,
  priority text not null default 'medium'
    check (priority in ('low','medium','high','urgent')),
  status text not null default 'open'
    check (status in ('open','in_progress','resolved','closed')),
  assigned_to uuid references platform_admins(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  sender_type text not null check (sender_type in ('tenant','platform_admin')),
  message text not null,
  created_at timestamptz not null default now()
);

-- platform_audit_log: separate from org's own audit_events on purpose.
-- A data reset wipes an org's audit_events — this table must survive that.
create table platform_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_admin_id uuid not null references platform_admins(user_id),
  action text not null,
  org_id uuid references organizations(id),
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);
```

**RLS note:** `platform_admins`, `data_reset_requests` (admin-side read), `support_tickets` (admin-side read across all orgs), and `platform_audit_log` are read via `SECURITY DEFINER` functions that check `exists (select 1 from platform_admins where user_id = auth.uid())` — this is the one deliberate exception to the "everything scoped by org_id" rule elsewhere in the codebase. Document this exception clearly in `CLAUDE.md` so a future session doesn't "fix" it by adding org_id scoping.

---

## PART 2 — Sequential tasks

### P8-T1 · Organization settings page (tenant-facing)
- **Target files:** `supabase/migrations/019_org_settings.sql`, `app/(dashboard)/settings/organization/page.tsx`, `lib/repositories/organizations.ts`, `lib/validations/organization.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, database plus settings-feature abstractions only. Create `supabase/migrations/019_org_settings.sql` adding `contact_person_name`, `logo_url`, `address`, `contact_email`, `contact_phone` columns to `organizations`. Then build `app/(dashboard)/settings/organization/page.tsx`: a form (React Hook Form + Zod in `lib/validations/organization.ts`) editable only by `org_admin` role, with fields for company name, contact person name, logo upload (Supabase Storage, a new public `org-logos` bucket scoped by org_id path prefix), address, email, phone. Add `lib/repositories/organizations.ts` with `getOrganization`, `updateOrganization`. Enforce org_admin-only update via RLS policy on organizations, not just UI role check. Do not touch billing or other settings.
- **Gate:** `supabase db reset` clean, `npm run typecheck && npm run lint`, then smoke: non-admin user cannot save changes (server rejects), admin can and logo renders in AppSidebar.

### P8-T2 · Transactional email provider
- **Target files:** `lib/email/client.ts`, `lib/email/templates/otp-code.tsx`, `.env.example`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, integrations abstraction only. Set up Resend as the transactional email provider: `lib/email/client.ts` exporting a `sendEmail({ to, subject, react })` wrapper, and a first template `lib/email/templates/otp-code.tsx` (React Email component) rendering a 6-digit code with a 10-minute expiry notice. Add `RESEND_API_KEY` to `.env.example`. Do not wire this to any feature yet — this task only proves the send path works with a manual test script.
- **Gate:** `npm run typecheck`, then a one-off script sends a real test email to a personal inbox and it arrives.

### P8-T3 · Platform admin foundation
- **Target files:** `supabase/migrations/020_platform_admin.sql`, `middleware.ts`, `app/(platform-admin)/layout.tsx`, `lib/auth/platform-admin.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, database plus auth abstractions only. Create `supabase/migrations/020_platform_admin.sql` defining `platform_admins` (user_id references auth.users, no self-serve insert path — RLS denies all client writes) and `platform_audit_log` (actor_admin_id, action, org_id, before_json, after_json, created_at) with a `SECURITY DEFINER` function `is_platform_admin(uid uuid) returns boolean`. Add `lib/auth/platform-admin.ts` exporting `requirePlatformAdmin()` for use in server components/actions. Update `middleware.ts` to gate any `/platform-admin/*` route: unauthenticated or non-platform-admin users redirect away. Create a bare `app/(platform-admin)/layout.tsx` shell with no dashboard content yet. Do not build any admin UI screens in this task.
- **Gate:** `supabase db reset` clean, manually insert your own user_id into `platform_admins` via SQL editor, confirm `/platform-admin` loads for you and 403s/redirects for a normal tenant user.

### P8-T4 · Super-admin dashboard
- **Target files:** `supabase/migrations/021_platform_views.sql`, `app/(platform-admin)/page.tsx`, `app/(platform-admin)/organizations/page.tsx`, `components/platform-admin/org-table.tsx`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, platform-admin feature abstraction only. Create `supabase/migrations/021_platform_views.sql` with a `SECURITY DEFINER` function `get_platform_organizations()` returning org id, name, workspace_type, subscription plan tier, subscription status, seat count, trial end date, created_at — callable only when `is_platform_admin(auth.uid())` is true, raising an exception otherwise. Build `app/(platform-admin)/page.tsx` showing total companies onboarded, trial vs paid counts, and recent signups. Build `app/(platform-admin)/organizations/page.tsx` with a full sortable/filterable table of every tenant organization. Do not expose any tenant's operational data (loads, invoices) here — organization metadata only.
- **Gate:** `npm run typecheck && npm run lint`, then smoke: dashboard shows correct total company count matching `select count(*) from organizations` run directly.

### P8-T5 · Support ticket system
- **Target files:** `supabase/migrations/022_support_tickets.sql`, `app/(dashboard)/support/page.tsx`, `app/(platform-admin)/tickets/page.tsx`, `components/support/ticket-thread.tsx`, `app/actions/tickets.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, database, support feature, and platform-admin abstractions. Create `supabase/migrations/022_support_tickets.sql` with `support_tickets` and `support_ticket_messages` tables as specified in docs/PHASE_8_PLATFORM_ADMIN.md section 1.1. RLS: tenant users see and create only their own org's tickets; platform admins see and reply to all tickets via the `is_platform_admin` check. Build the tenant-facing `app/(dashboard)/support/page.tsx` (create ticket, view own tickets, threaded replies) and the admin-facing `app/(platform-admin)/tickets/page.tsx` (queue across all orgs, filter by status/priority, assign to self, reply). Use `lib/email/client.ts` from P8-T2 to notify Loadlinkers admins on new ticket creation and notify the tenant on admin reply. Server actions in `app/actions/tickets.ts` for create/reply/status-change.
- **Gate:** `npm run typecheck && npm run lint`, then smoke: tenant creates a ticket, it appears in the platform-admin queue, admin reply triggers an email and appears in the tenant's thread.

### P8-T6 · Data reset flow (OTP verify → admin approval → destructive execute)
- **Target files:** `supabase/migrations/023_data_reset.sql`, `app/(dashboard)/settings/danger-zone/page.tsx`, `app/(platform-admin)/reset-requests/page.tsx`, `app/actions/data-reset.ts`, `lib/email/templates/otp-code.tsx` (reuse from P8-T2)
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, database, settings feature, and platform-admin abstractions. Create `supabase/migrations/023_data_reset.sql` with `data_reset_requests` exactly as specified in docs/PHASE_8_PLATFORM_ADMIN.md section 1.1, plus a `SECURITY DEFINER` function `execute_data_reset(request_id uuid)` that, only when called by a platform admin and only when the matching request status is 'approved', truncates or deletes all rows in `loads`, `carriers`, `customers`, `load_documents`, `invoices`, `audit_events` for that org_id inside a single transaction, then sets the request status to 'completed' and writes one row to `platform_audit_log` (not audit_events, since that table is being wiped). Build the tenant flow at `app/(dashboard)/settings/danger-zone/page.tsx`: request reset → OTP emailed to the org's registered contact_email (hash the code, 10-minute expiry, reuse the P8-T2 template) → on correct code entry, status moves to 'pending_approval' and the org admin sees "awaiting Loadlinkers approval." Build the admin side at `app/(platform-admin)/reset-requests/page.tsx`: queue of pending_approval requests with org name, requester, requested_at, and Approve/Reject buttons; approving triggers `execute_data_reset` immediately. Never allow the destructive execute path to run without both email_verified_at being set and status being 'approved' at execution time — check both conditions inside the function itself, not just in the UI.
- **Gate:** `npm run typecheck && npm run lint`, then smoke: full path end to end — request → OTP entered correctly → shows pending_approval → platform admin approves → org's loads/carriers/invoices are empty → org and its users still exist and can log in.

---

## Sequencing rationale

P8-T1 (org settings) has no dependency on the admin role and can run anytime, including in parallel with P8-T3. P8-T2 (email) is a small, isolated utility task that both P8-T5 and P8-T6 need, so it goes early and is proven working in isolation before anything depends on it. P8-T3 (platform admin foundation) is the hard dependency for T4, T5, and T6 — none of the cross-tenant screens or approval flows can exist without the `is_platform_admin` check in place first. P8-T6 is last because it has the most moving parts (email + approval queue + destructive SQL) and the highest cost of a mistake — it should only be built once the admin dashboard and ticket queue patterns are already proven working in T4 and T5.
