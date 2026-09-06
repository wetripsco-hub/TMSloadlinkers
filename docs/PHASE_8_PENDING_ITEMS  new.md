# Phase 8 — Pending Items (Handoff for Next Chat)

**Context:** Phase 8 (P8-T1 through P8-T6 — org settings, platform admin foundation, super-admin dashboard, support tickets, data reset flow) is functionally complete and gated at the code/typecheck/lint/backend level. The items below are the loose ends that still need action before considering Phase 8 fully closed.

---

## 1. P8-T1 — Manual UI smoke test (not yet done)
**Page:** `/settings/organization`
- Log in as an `org_admin`, fill in company name, contact person, logo, address, email, phone → Save.
- Refresh — confirm it persists. Confirm the sidebar logo/name updates.
- Log in as a non-admin (if a test account exists) → attempt save → must be rejected server-side, not just hidden in UI.

## 2. P8-T5 — Manual UI smoke test (not yet done)
Only the data/API layer was verified for support tickets — the authenticated browser flow was never run end to end.
- `/support` — as a tenant, create a ticket.
- `/platform-admin/tickets` — as `alishahid9216@gmail.com` (platform admin), confirm the ticket appears, assign to self, reply.
- `/support` — back as the tenant, confirm the admin's reply shows in the thread.

## 3. Organization data cleanup — awaiting confirmation
14 junk test orgs (KAKA 1234, ABC, asd, 12312323, 13123123sads123, LALAkaka, KAKA1233, KAKAMasd, Gameover, gaga add, sadasdd, fgafsfaf, qwewqe, lala musa) plus **Apex Freight Inc** were approved for deletion, along with all dependent rows (profiles, subscriptions, loads, carriers, customers, invoices, load_documents, audit_events, support_tickets). "LoadLinkers Logistics" (the real client org) must NOT be touched.
- Command was given to Claude Code CLI to execute this via Supabase MCP inside a transaction, with a post-delete verification query (`select count(*) from organizations`).
- **Raw confirmation output was never captured/reviewed.** Next step: get that output from Claude Code, confirm exactly 1 organization remains, and verify no orphaned rows were left in dependent tables.

## 4. Resend domain verification — launch blocker, not yet started
The current Resend API key is sandboxed and can only send to the account owner's own email (`wetrips.co@gmail.com`). Until a sending domain is verified at `resend.com/domains` (adding SPF/DKIM DNS records for a real company domain), **no real tenant will ever receive an email** — this breaks OTP-based data reset (P8-T6), support ticket notifications (P8-T5), and any future transactional email. Must be resolved before launch, not urgent for continued dev/testing.

## 5. New bug discovered — forgot-password / magic link flow is broken
- `/forgot-password` returns a 404 — the route doesn't exist.
- A Supabase magic-link recovery email was sent and clicked, but it lands on the logged-out homepage instead of authenticating the user — no `/auth/callback`-style handler appears to exist to process the recovery token.
- **Impact:** any real tenant user who forgets their password has no way to recover their account today. This needs to become its own task (likely Phase 7 or a new small phase) — build a proper `/forgot-password` request page plus the callback route that exchanges the recovery token for a session.
- Workaround used during testing: password was set directly via Supabase Admin API through Claude Code (fine for dev accounts, not a fix for tenants).

---

## Already resolved / no action needed
- P8-T1 lint — clean, 0 errors.
- P8-T2 (email client + OTP template) — proven working via the real Resend send calls made during P8-T5's smoke test (message IDs returned successfully).
- P8-T3 (platform admin foundation) — migration verified, RLS confirmed deny-all except via `is_platform_admin()`, route redirect behavior implemented (still worth a final visual pass once login is sorted, but not blocking).
- P8-T4 (super-admin dashboard) — backend/RPC verified, org count logic matches direct query.
- P8-T6 (data reset flow) — fully proven end-to-end on a disposable test org, both destructive-path guards independently verified, test org cleaned up, no production data touched.
- `025_platform_admin_cross_org_reads.sql` — real RLS gap found and fixed mid-build (platform admin couldn't see org name / requester email without it); applied with sign-off.
- `@react-email/render` missing dependency — found and fixed; this had been silently breaking all Resend email sends including the OTP template until this pass.

---

## Suggested order for next session
1. Get the raw output from the org-deletion command (item 3) — confirm clean state.
2. Run the two manual UI smoke tests (items 1 and 2) — no Claude Code needed, just browser clicks.
3. Decide on and scope a small task for the forgot-password fix (item 5).
4. Schedule Resend domain verification (item 4) whenever the company domain is ready — not urgent today.
