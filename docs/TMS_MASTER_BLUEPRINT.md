# FreightLink Dual-Core TMS — Master Blueprint & Implementation Plan

**Client:** Loadlinkers Logistics
**Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres + RLS + Storage + Edge Functions)
**Execution environment:** VS Code + Claude Code CLI + Graphify AST analysis + Superpowers rules (CLAUDE.md)
**Document status:** Implementation guide — save at `docs/TMS_MASTER_BLUEPRINT.md`

---

## How to use this document

Part 1 is the *what* — the architecture you are building toward. Read it once, refer back when a decision feels ambiguous.

Part 2 is the *how* — a linear queue of sprints. Each task has a file path, a paste-ready prompt, a context boundary, and a verification gate. Work strictly top to bottom. Do not start a task until the previous task's gate is green.

Every prompt in Part 2 already contains the context-boundary instruction. Paste it verbatim.

---

# PART 1 — Unified TMS Architecture & Feature Blueprint

## 1.1 The Dual-Core principle

This is one codebase, one database, two operating modes. The mode is a property of the tenant (`organizations.workspace_type`), not a separate application.

| Dimension | Broker Core | Dispatcher Core |
|---|---|---|
| Who the tenant is | Licensed property broker (MC authority, BOC-3, surety bond) | Agent representing owner-operators / small fleets |
| Revenue field | `broker_margin` = `shipper_rate − carrier_pay` (generated column) | `dispatcher_commission_earned` = % of gross load pay, or flat weekly |
| Counterparty | Shipper (AR) + Carrier (AP) | Carrier only (the carrier is the *customer*) |
| Primary document | Issued RateCon (outbound) | External RateCon (inbound, OCR-ingested) |
| OCR direction | POD + carrier invoice → unlock shipper billing | Broker RateCon → auto-create load |
| Settlement | Shipper invoice + carrier settlement voucher | Weekly commission invoice to carrier |

**Architectural consequence:** never fork components per mode. Use a single `useWorkspaceMode()` hook that reads the tenant's `workspace_type` and conditionally renders fields, columns, and nav items. Business logic differences live in `lib/domain/` strategy modules, not in the UI layer.

---

## 1.2 Functional domains

### Domain A — Dashboard & KPIs
The landing surface after auth. Mode-aware.

- **Shared tiles:** active loads by status, loads delivered this week, documents pending OCR review, carriers with expiring insurance (< 30 days).
- **Broker-only tiles:** gross margin MTD, margin %, top 5 customers by revenue, unbilled delivered loads (AR at risk).
- **Dispatcher-only tiles:** commission earned MTD, fleet utilization (trucks dispatched / trucks available), average RPM by truck, unpaid dispatch invoices.
- **Interaction:** every tile is a filtered deep-link into the load table. No dead-end numbers.
- **Data strategy:** one Postgres view per tile group (`v_dashboard_broker`, `v_dashboard_dispatcher`), queried server-side in a React Server Component. Do not compute KPIs client-side over the full load set.

### Domain B — Load Management
The operational spine.

- **Lifecycle states:** `quoted → posted_to_boards → covered → dispatched → at_pickup → in_transit → at_delivery → delivered → pod_uploaded → invoiced → settled` (plus terminal `cancelled`).
- **Transition rules are enforced in the database**, not the UI — a Postgres trigger validates that the new status is a legal successor of the old one. UI merely offers legal next states.
- **Views:** Kanban board (drag between status columns) and a dense data table (TanStack Table, server-side pagination, column filters). Same data, two lenses, user preference persisted.
- **Creation paths:** (1) manual wizard, (2) OCR RateCon import, (3) duplicate-from-existing.
- **Load wizard:** multi-step, React Hook Form + Zod, with live rate-per-mile and margin/commission calculation as the user types. Draft persisted to `localStorage` so a refresh doesn't destroy 20 fields of entry.

### Domain C — Carrier Verification & Safety
Trust gate before a load can be assigned.

- Carrier record stores DOT#, MC#, safety rating, authority status, insurance carrier/policy/expiry, cargo + auto liability limits, W-9 and COI file URLs.
- **Vetting check runs on carrier create and on a nightly refresh job**, results cached in `carriers` with a `last_verified_at` timestamp. Never call an external safety API synchronously inside a load-assignment request path.
- **Blocking rules:** a carrier is ineligible for assignment if authority is not active, insurance is expired, cargo coverage is below the load's declared commodity value, or `is_blacklisted` is true. The assignment mutation rejects server-side; the UI reflects it with a badge, but the UI is not the enforcement point.
- **Compliance badges:** green (verified, all clear) · amber (verified, expiring within 30 days) · red (blocked) · grey (never verified).

> **Reality check on FMCSA — read before Phase 4.** The PRD assumes a self-serve FMCSA "webKey" that a tenant drops into a BYOK vault. In practice FMCSA's public SAFER/QCMobile surfaces are limited and rate-constrained, and reliable production carrier vetting is normally sourced from a licensed data provider (Carrier411, RMIS, MyCarrierPackets, Highway, etc.) under a commercial agreement. **Build the vetting layer behind a provider-agnostic interface** (`CarrierVerificationProvider`) with a mock provider first. Swap in whichever real source you contract with. Do not hard-code one vendor's response shape into your carrier table.

### Domain D — Document Intelligence (OCR)
Zero-touch data entry from photographs.

- **Pipeline:** browser capture (HTML5 canvas: auto-contrast, glare reduction, perspective deskew) → signed upload to Supabase Storage → Edge Function invokes a multimodal vision model with a strict JSON schema → confidence scoring → commit or flag.
- **Confidence gate:** field confidence ≥ 95% auto-populates; below 95% the document gets `ocr_status = 'review_required'` and surfaces in a side-by-side review queue (image left, extracted fields right, one-click accept per field).
- **Document types and their triggers:**
  - *POD / BOL* → verify signature presence, match PO#, set load to `delivered`, trigger shipper invoice draft.
  - *External RateCon* → create a new load pre-filled with lane, dates, rate, equipment; assign to a fleet truck.
  - *Carrier invoice* → 3-way match against RateCon + POD; on exact match, queue settlement voucher.
  - *Lumper / scale receipt* → append accessorial line item to the settlement voucher, flag for shipper rebilling.
- **Idempotency:** every OCR job carries a job key derived from the storage object hash. Re-processing the same image must not create a duplicate load.

> **Cost note.** A vision-model call per document is the expensive path. Design the Edge Function so the extraction provider is injectable, and consider a cheaper first-pass (document-AI style text extraction) with vision escalation only for low-confidence or handwriting-heavy pages. Log per-document token/cost so you can see the unit economics before you scale tenants onto it.

### Domain E — Financials & Settlements
Money in, money out, and proof that they match.

- **Three invoice types:** shipper invoice (AR), carrier settlement voucher (AP), dispatcher commission invoice.
- **3-way match** = agreed carrier pay (from RateCon) vs. signed POD (delivery confirmed) vs. carrier invoice amount. All three aligned → `three_way_matched = true` → settlement is releasable. Any variance → exception queue with the delta shown explicitly.
- **Amount fields are `NUMERIC`, never floats.** All arithmetic happens in Postgres generated columns or in `lib/money.ts` with integer-cent handling. No `Number` math on currency in React.
- **PDF generation** via `@react-pdf/renderer` in a server route, streamed, then persisted to Storage with the URL written back to the invoice/load record. Generate once, reuse; do not regenerate per view.

### Domain F — Tracking & Telematics
Lightweight, no driver app install.

- Each load carries a `tracking_token` (random 32-byte hex, unique). A tokenized public URL gives the driver a check-in page — no login.
- Driver page uses the browser Geolocation API, posts pings to `loads.last_known_lat/lng/last_ping_at`.
- Geofence logic (arrival within radius of origin/destination) runs server-side and advances status automatically, writing an audit event.
- Shipper-facing tracking view: same token family, read-only, shows milestone timeline and last known position on a map.
- **Security:** tracking tokens are bearer credentials. They must be scoped to a single load, revocable, and excluded from RLS-protected tables via a dedicated public-read view exposing only non-sensitive fields (never rates, never margin).

---

## 1.3 Cross-cutting concerns (missing from the original PRD — add them now, not later)

| Concern | Decision |
|---|---|
| **BYOK encryption** | `encrypted_api_key TEXT` is not encryption. Encrypt application-side with AES-256-GCM using a master key held in the server environment (never in the client bundle, never in the database). Store ciphertext + IV + auth tag. Decrypt only inside Edge Functions / server actions at call time. Never return plaintext keys to the client — mask to last 4 characters. |
| **Auth flow** | Supabase Auth. Email + password with magic-link fallback. Org creation on first signup; subsequent users join via invite token. A Postgres trigger on `auth.users` insert creates the matching `profiles` row. |
| **Audit log** | Freight accounting needs a trail. One append-only `audit_events` table: `org_id`, `actor_user_id`, `entity_type`, `entity_id`, `action`, `before_json`, `after_json`, `created_at`. Written by triggers on `loads`, `invoices`, `carriers`. |
| **Rate limiting** | OCR and external-API endpoints are the abuse surface. Per-org token bucket enforced in the Edge Function against a Postgres counter table. |
| **Testing** | Vitest for `lib/domain/` pure logic (margin math, status transitions, 3-way match). Playwright for three critical flows: signup→org creation, load create→dispatch, OCR upload→review→accept. Not comprehensive coverage — critical-path coverage. |
| **SaaS billing** | Tiers exist in the schema (`starter`/`growth`/`enterprise`) but nothing enforces them. Stripe subscription + a `subscription_status` check in middleware. Deferred to post-Phase-6, but do not launch without it. |
| **Load-board APIs** | DAT and Truckstop API access is partner-gated and requires commercial approval — it is not a BYOK credential a tenant self-serves. Build the posting layer behind a `LoadBoardProvider` interface with a no-op provider. Ship without it; wire it when a partnership lands. |

---

## 1.4 TypeScript contracts

Place these in `types/domain.ts`. They are the single source of truth for shape; generate Supabase types separately into `types/database.ts` and map between them at the repository layer.

```ts
// ---------- Shared primitives ----------
export type UUID = string;
export type ISODateTime = string;
export type Cents = number; // money in integer cents — never float

export type WorkspaceType = 'freight_brokerage' | 'truck_dispatch' | 'hybrid_enterprise';
export type UserRole =
  | 'org_admin' | 'broker_agent' | 'dispatcher_agent'
  | 'accountant' | 'read_only_viewer';

// ---------- Organization & identity ----------
export interface Organization {
  id: UUID;
  name: string;
  workspaceType: WorkspaceType;
  mcNumber: string | null;
  dotNumber: string | null;
  createdAt: ISODateTime;
}

export interface Profile {
  id: UUID;              // === auth.users.id
  orgId: UUID;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

// ---------- Loads ----------
export type LoadStatus =
  | 'quoted' | 'posted_to_boards' | 'covered' | 'dispatched'
  | 'at_pickup' | 'in_transit' | 'at_delivery'
  | 'delivered' | 'pod_uploaded' | 'invoiced' | 'settled' | 'cancelled';

export interface LoadStop {
  facilityName: string | null;
  address: string | null;
  city: string;
  state: string;
  zip: string;
  windowStart: ISODateTime;
  windowEnd: ISODateTime | null;
}

export interface Load {
  id: UUID;
  orgId: UUID;
  loadNumber: string;
  status: LoadStatus;
  customerId: UUID | null;
  carrierId: UUID | null;
  createdByUserId: UUID | null;

  // dual financial engine
  shipperRate: Cents;
  carrierPay: Cents;
  brokerMargin: Cents;               // derived, read-only from DB
  dispatcherCommissionEarned: Cents;

  equipmentType: string;
  weightLbs: number | null;
  commodity: string | null;
  temperatureSetting: string | null;
  specialInstructions: string | null;

  origin: LoadStop;
  destination: LoadStop;

  trackingToken: string;
  driverName: string | null;
  driverPhone: string | null;
  truckNumber: string | null;
  trailerNumber: string | null;
  lastKnownLat: number | null;
  lastKnownLng: number | null;
  lastPingAt: ISODateTime | null;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ---------- Carriers & compliance ----------
export type ComplianceBadge = 'verified' | 'expiring' | 'blocked' | 'unverified';

export interface Carrier {
  id: UUID;
  orgId: UUID;
  companyName: string;
  dotNumber: string;
  mcNumber: string;
  safetyRating: string;
  authorityStatus: string;
  insuranceCarrierName: string | null;
  insurancePolicyNumber: string | null;
  insuranceExpiryDate: string | null;   // date only
  cargoCoverageLimit: Cents;
  autoLiabilityLimit: Cents;
  isBlacklisted: boolean;
  blacklistReason: string | null;
  isInternalFleet: boolean;
  dispatchFeePercentage: number;
  dispatchFeeFlatWeekly: Cents;
  lastVerifiedAt: ISODateTime | null;
}

export interface CarrierVerificationResult {
  authorityActive: boolean;
  safetyRating: string;
  insuranceOnFile: boolean;
  outOfServiceDate: string | null;
  source: string;             // which provider answered
  fetchedAt: ISODateTime;
  raw: unknown;               // provider payload, stored for audit
}

export interface CarrierVerificationProvider {
  verify(input: { dotNumber?: string; mcNumber?: string }): Promise<CarrierVerificationResult>;
}

// ---------- Documents & OCR ----------
export type DocumentType =
  | 'POD' | 'BOL' | 'RateConfirmation_Signed'
  | 'Carrier_Invoice' | 'Lumper_Receipt' | 'Scale_Ticket';

export type OcrStatus =
  | 'pending' | 'processing' | 'completed' | 'failed' | 'review_required';

export interface OcrField<T> {
  value: T | null;
  confidence: number;   // 0–100
}

export interface RateConExtraction {
  brokerName: OcrField<string>;
  brokerMcNumber: OcrField<string>;
  agreedRate: OcrField<Cents>;
  originCity: OcrField<string>;
  originState: OcrField<string>;
  destCity: OcrField<string>;
  destState: OcrField<string>;
  pickupWindowStart: OcrField<ISODateTime>;
  deliveryWindowStart: OcrField<ISODateTime>;
  equipmentType: OcrField<string>;
  commodity: OcrField<string>;
  weightLbs: OcrField<number>;
}

export interface PodExtraction {
  signatureDetected: OcrField<boolean>;
  deliveryDateTime: OcrField<ISODateTime>;
  pieceCount: OcrField<number>;
  sealNumber: OcrField<string>;
  exceptionNoted: OcrField<boolean>;
  poNumber: OcrField<string>;
}

export interface LoadDocument {
  id: UUID;
  orgId: UUID;
  loadId: UUID | null;
  documentType: DocumentType;
  fileUrl: string;
  thumbnailUrl: string | null;
  ocrStatus: OcrStatus;
  ocrConfidenceScore: number | null;
  ocrExtractedJson: RateConExtraction | PodExtraction | Record<string, unknown> | null;
  isVerified: boolean;
  verifiedByUserId: UUID | null;
  uploadedAt: ISODateTime;
}

// ---------- Financials ----------
export type InvoiceType =
  | 'shipper_invoice' | 'carrier_settlement_voucher' | 'dispatcher_carrier_commission';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'factored' | 'void';

export interface Invoice {
  id: UUID;
  orgId: UUID;
  loadId: UUID | null;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  billToName: string;
  billToEmail: string | null;
  amountTotal: Cents;
  amountPaid: Cents;
  amountDue: Cents;          // derived
  issueDate: string;
  dueDate: string;
  status: PaymentStatus;
  threeWayMatched: boolean;
  pdfDownloadUrl: string | null;
}

export interface ThreeWayMatchResult {
  matched: boolean;
  agreedCarrierPay: Cents;
  invoicedAmount: Cents;
  variance: Cents;
  podOnFile: boolean;
  reasons: string[];
}
```

---

# PART 2 — Sequential Execution Sprints for Claude Code

**Rules that apply to every single task below:**

1. Run tasks in order. A task begins only when the previous task's verification gate passes.
2. Every prompt already contains the context-boundary clause. Paste it as written — do not summarize it away.
3. If a gate fails, fix within that task. Never carry a red gate into the next task.
4. Commit after each passing gate with the task ID as the message prefix (e.g. `P2-T3: load repository layer`).

---

## PHASE 1 — Foundation: schema, auth, tenancy

### P1-T1 · Core schema migration
- **Target files:** `supabase/migrations/001_foundation.sql`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md` and inspect only the database/migration abstraction. Create `supabase/migrations/001_foundation.sql` defining: enums `tenant_workspace_type`, `subscription_plan_tier`, `user_role_type`; tables `organizations` and `profiles` (profiles.id references auth.users on delete cascade, profiles.org_id references organizations); a trigger on auth.users insert that creates the matching profiles row; and RLS enabled on both tables with select/update policies scoping every row to the caller's org_id. Add SQL comments explaining each policy. Do not create any other table. Do not modify application code.
- **Gate:** `supabase db reset` runs clean, then `supabase db lint` reports no errors.

### P1-T2 · Operational schema migration
- **Target files:** `supabase/migrations/002_operations.sql`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, database abstraction only. Create `supabase/migrations/002_operations.sql` defining tables `customers`, `carriers`, `loads`, `load_documents`, `invoices` with the enums `load_operational_status`, `invoice_type_enum`, `payment_status_enum`. Every table carries org_id referencing organizations with RLS enabled and org-scoped policies. `loads.broker_margin` is a generated stored column (shipper_rate − carrier_pay). `invoices.amount_due` is generated (amount_total − amount_paid). Add indexes on (org_id, status) for loads and (org_id, ocr_status) for load_documents. Do not write application code.
- **Gate:** `supabase db reset` clean · `supabase db lint` no errors.

### P1-T3 · Status transition guard
- **Target files:** `supabase/migrations/003_load_status_guard.sql`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, database abstraction only. Create `supabase/migrations/003_load_status_guard.sql` with a Postgres function and BEFORE UPDATE trigger on `loads` that rejects any status change which is not a legal successor. Legal chain: quoted→posted_to_boards→covered→dispatched→at_pickup→in_transit→at_delivery→delivered→pod_uploaded→invoiced→settled. Any status may move to cancelled. Raise a descriptive exception on violation. Do not touch application code.
- **Gate:** `supabase db reset` clean; manually attempt an illegal transition in the SQL editor and confirm it errors.

### P1-T4 · Audit log
- **Target files:** `supabase/migrations/004_audit.sql`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, database abstraction only. Create `supabase/migrations/004_audit.sql` with an append-only `audit_events` table (org_id, actor_user_id, entity_type, entity_id, action, before_json, after_json, created_at) plus AFTER INSERT/UPDATE/DELETE triggers on loads, invoices, and carriers that write to it. RLS: org-scoped select only, no client insert/update/delete. Do not touch application code.
- **Gate:** `supabase db reset` clean · `supabase db lint` no errors.

### P1-T5 · Generated types + domain contracts
- **Target files:** `types/database.ts`, `types/domain.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, types abstraction only. Regenerate `types/database.ts` from the Supabase schema. Then create `types/domain.ts` containing the hand-written domain interfaces (Organization, Profile, Load, LoadStop, Carrier, CarrierVerificationResult, CarrierVerificationProvider, LoadDocument, OcrField, RateConExtraction, PodExtraction, Invoice, ThreeWayMatchResult) exactly as specified in docs/TMS_MASTER_BLUEPRINT.md section 1.4. Money is typed as Cents (integer). No implementation logic in this file.
- **Gate:** `npm run typecheck`

### P1-T6 · Auth flow
- **Target files:** `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`, `lib/supabase/server.ts`, `lib/supabase/client.ts`, `middleware.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md` and inspect only the auth/session abstraction. Implement Supabase Auth: server and browser client factories, a `middleware.ts` that refreshes the session and redirects unauthenticated users away from `/dashboard/*`, and login + signup pages using shadcn/ui Form, React Hook Form, and Zod. Signup collects org name and workspace type, creates the organization, then the user. Do not build any dashboard UI.
- **Gate:** `npm run typecheck && npm run lint`, then manual smoke: signup creates one organizations row and one profiles row.

---

## PHASE 2 — Load management core

### P2-T1 · Money and margin utilities
- **Target files:** `lib/money.ts`, `lib/domain/margin.ts`, `lib/domain/__tests__/margin.test.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, lib abstraction only. Create `lib/money.ts` (integer-cent parse, format, add, subtract — no floats) and `lib/domain/margin.ts` exporting pure functions: `calculateBrokerMargin`, `calculateMarginPercent`, `calculateDispatcherCommission(grossPay, percentage)`, `calculateRatePerMile(rate, miles)`. Add Vitest unit tests covering zero, negative, and rounding-boundary cases. Pure functions only — no React, no Supabase.
- **Gate:** `npm run typecheck && npm run test`

### P2-T2 · Load repository layer
- **Target files:** `lib/repositories/loads.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md` and inspect only the data-access abstraction. Create `lib/repositories/loads.ts` with typed server-side functions: `listLoads(filters, pagination)`, `getLoadById(id)`, `createLoad(input)`, `updateLoadStatus(id, nextStatus)`, `assignCarrier(loadId, carrierId)`. Map database rows to the `Load` domain interface from types/domain.ts. All queries rely on RLS for tenant scoping — never accept org_id as a caller-supplied parameter. No UI code.
- **Gate:** `npm run typecheck && npm run lint`

### P2-T3 · Workspace mode hook
- **Target files:** `hooks/use-workspace-mode.ts`, `lib/domain/workspace.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, hooks abstraction only. Create `useWorkspaceMode()` returning the current tenant's workspaceType plus derived booleans `isBroker`, `isDispatcher`, `isHybrid`, and a `visibleFinancialFields` array. Add `lib/domain/workspace.ts` with the pure mapping from WorkspaceType to visible field keys. No component changes yet.
- **Gate:** `npm run typecheck`

### P2-T4 · Load creation wizard
- **Target files:** `app/(dashboard)/loads/new/page.tsx`, `components/loads/load-wizard.tsx`, `lib/validations/load.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md` and inspect only the loads feature abstraction. Build a multi-step load creation wizard (steps: customer & rate, origin, destination, equipment & cargo, review) using React Hook Form + Zod schema in `lib/validations/load.ts` and shadcn/ui components. Show live margin (broker mode) or commission (dispatcher mode) via useWorkspaceMode, using the pure functions in lib/domain/margin.ts. Persist the in-progress draft to localStorage. Submit through the loads repository. Do not modify the repository or schema.
- **Gate:** `npm run typecheck && npm run lint`, then smoke: create a load and confirm the row appears in Supabase.

### P2-T5 · Load table view
- **Target files:** `app/(dashboard)/loads/page.tsx`, `components/loads/load-table.tsx`, `components/loads/load-filters.tsx`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, loads feature abstraction only. Build the loads data table using TanStack Table with server-side pagination and filters (status, date range, customer, carrier). Columns adapt to workspace mode — margin column for broker, commission column for dispatcher. Row click navigates to the load detail route. Reuse the loads repository; do not add new queries elsewhere.
- **Gate:** `npm run typecheck && npm run lint`

### P2-T6 · Kanban board view
- **Target files:** `components/loads/load-kanban.tsx`, `components/loads/load-card.tsx`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, loads feature abstraction only. Build a Kanban board with one column per load status. Drag-and-drop moves a load between columns and calls `updateLoadStatus`. Optimistically update, and roll back with a toast if the server rejects the transition. Add a view toggle (table / kanban) persisted in localStorage. Do not change the transition rules — the database owns them.
- **Gate:** `npm run typecheck && npm run lint`, then smoke: drag a load to an illegal column and confirm it rolls back with an error toast.

### P2-T7 · Load detail route
- **Target files:** `app/(dashboard)/loads/[id]/page.tsx`, `components/loads/load-detail-header.tsx`, `components/loads/load-timeline.tsx`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, loads feature abstraction only. Build the load detail page: header with load number, status badge, and legal next-status actions; tabs for Details, Documents, Tracking, Financials (empty placeholders for the tabs owned by later phases); and a milestone timeline sourced from audit_events. Read-only except the status action. Do not implement document upload or PDF generation here.
- **Gate:** `npm run typecheck && npm run lint`

---

## PHASE 3 — Carrier verification & compliance

### P3-T1 · Verification provider interface + mock
- **Target files:** `lib/providers/carrier-verification/types.ts`, `lib/providers/carrier-verification/mock.ts`, `lib/providers/carrier-verification/index.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, providers abstraction only. Define the `CarrierVerificationProvider` interface from types/domain.ts, implement a `MockCarrierVerificationProvider` returning deterministic fixtures keyed by DOT number (include an active carrier, a revoked-authority carrier, and an expired-insurance carrier), and export a factory that selects the provider from an env var, defaulting to mock. No network calls in this task.
- **Gate:** `npm run typecheck && npm run test`

### P3-T2 · Compliance rules engine
- **Target files:** `lib/domain/compliance.ts`, `lib/domain/__tests__/compliance.test.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, lib abstraction only. Create pure functions `evaluateCarrierCompliance(carrier, today)` returning a ComplianceBadge plus reason strings, and `canAssignCarrierToLoad(carrier, load)` returning `{ allowed: boolean; blockers: string[] }`. Blockers: inactive authority, expired insurance, insurance expiring before delivery date, blacklisted, cargo coverage below commodity value. Add Vitest tests for every blocker path. No I/O.
- **Gate:** `npm run typecheck && npm run test`

### P3-T3 · Carrier repository + verification action
- **Target files:** `lib/repositories/carriers.ts`, `app/actions/verify-carrier.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, data-access abstraction only. Create `lib/repositories/carriers.ts` (list, get, create, update, setBlacklist) mapping to the Carrier domain type, and a server action `verifyCarrier(carrierId)` that calls the verification provider, writes the result plus `last_verified_at` to the carrier row, and returns the CarrierVerificationResult. Rate-limit to one verification per carrier per hour. No UI.
- **Gate:** `npm run typecheck && npm run lint`

### P3-T4 · Carrier management UI
- **Target files:** `app/(dashboard)/carriers/page.tsx`, `app/(dashboard)/carriers/[id]/page.tsx`, `components/carriers/carrier-table.tsx`, `components/carriers/compliance-badge.tsx`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, carriers feature abstraction only. Build the carrier list table with compliance badges (green/amber/red/grey from lib/domain/compliance.ts), a detail page showing verification history and insurance expiry countdown, and a "Re-verify now" button calling the verifyCarrier action. Show blocker reasons inline. Do not modify the compliance rules or repository.
- **Gate:** `npm run typecheck && npm run lint`

### P3-T5 · Enforce carrier gate on assignment
- **Target files:** `lib/repositories/loads.ts`, `components/loads/carrier-assign-dialog.tsx`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md` and inspect the loads data-access abstraction plus lib/domain/compliance.ts. Modify `assignCarrier` to call `canAssignCarrierToLoad` server-side and reject with the blocker list when disallowed. Build a carrier assignment dialog that filters to eligible carriers, shows ineligible ones greyed out with their blocker reasons, and surfaces server rejections as toasts. Do not weaken the server-side check to accommodate the UI.
- **Gate:** `npm run typecheck && npm run lint`, then smoke: attempt to assign a revoked-authority carrier and confirm server rejection.

---

## PHASE 4 — Document intelligence & OCR

### P4-T1 · Storage buckets and upload policy
- **Target files:** `supabase/migrations/005_storage.sql`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, database abstraction only. Create `supabase/migrations/005_storage.sql` provisioning a private `load-documents` bucket with RLS policies allowing authenticated users to read and write only within a path prefix matching their org_id. Add a `document_jobs` table (id, org_id, document_id, object_hash unique, status, attempts, created_at) for OCR idempotency. No application code.
- **Gate:** `supabase db reset` clean · `supabase db lint` no errors.

### P4-T2 · Camera capture with canvas preprocessing
- **Target files:** `components/documents/camera-capture.tsx`, `lib/image/preprocess.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, documents feature abstraction only. Build a mobile-first camera capture component using getUserMedia with a capture button, retake, and confirm. `lib/image/preprocess.ts` exports pure canvas functions: auto-contrast, glare reduction, edge detection, and perspective deskew, returning a Blob. Handle permission-denied and no-camera cases with a file-picker fallback. No upload logic in this task.
- **Gate:** `npm run typecheck && npm run lint`, then smoke on a mobile viewport: capture produces a deskewed preview.

### P4-T3 · Upload pipeline
- **Target files:** `app/actions/upload-document.ts`, `lib/repositories/documents.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, data-access abstraction only. Create `uploadDocument(file, loadId, documentType)`: hash the blob, short-circuit if the hash already exists in document_jobs, upload to the load-documents bucket under the org prefix via a signed URL, insert the load_documents row with ocr_status 'pending', enqueue a document_jobs row, and return the document id. Add the documents repository (list by load, list review queue, get by id, markVerified). No OCR call yet.
- **Gate:** `npm run typecheck && npm run lint`

### P4-T4 · OCR extraction Edge Function
- **Target files:** `supabase/functions/ocr-extract/index.ts`, `supabase/functions/ocr-extract/schemas.ts`, `supabase/functions/ocr-extract/providers.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, edge-functions abstraction only. Build an Edge Function that consumes a document_jobs row, fetches the image, and calls an injectable vision provider with a strict JSON schema per document type (RateCon, POD, Carrier Invoice, Lumper Receipt) as defined in types/domain.ts. Return per-field values with confidence scores. Write results to load_documents.ocr_extracted_json, set ocr_status to 'completed' when every field is ≥95% confidence, otherwise 'review_required'. Retry up to 3 attempts with backoff; on final failure set 'failed'. Decrypt the tenant's BYOK key with AES-256-GCM inside this function only — never return it. Log per-document token cost.
- **Gate:** `npm run typecheck`, then `supabase functions serve` and invoke with a fixture image; confirm the row updates.

### P4-T5 · Human-in-the-loop review queue
- **Target files:** `app/(dashboard)/documents/review/page.tsx`, `components/documents/review-pane.tsx`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, documents feature abstraction only. Build the review queue listing documents with ocr_status 'review_required'. The review pane shows the image on the left and extracted fields on the right, each with its confidence score, an editable input, and a per-field accept control. Accepting all fields writes corrected values, sets is_verified true and ocr_status 'completed'. Do not modify the Edge Function.
- **Gate:** `npm run typecheck && npm run lint`, then smoke: a low-confidence fixture appears in the queue and can be accepted.

### P4-T6 · Post-OCR automation triggers
- **Target files:** `lib/domain/ocr-actions.ts`, `app/actions/apply-ocr-result.ts`, `lib/domain/__tests__/ocr-actions.test.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, domain abstraction only. Create pure functions mapping a completed extraction to its side effect: RateCon → a CreateLoadInput draft; POD → status advance to delivered plus an invoice-draft signal; Carrier Invoice → a ThreeWayMatchResult input; Lumper/Scale → an accessorial line item. Then a server action `applyOcrResult(documentId)` that executes the mapped effect transactionally and idempotently. Vitest tests for each mapping. Do not build UI.
- **Gate:** `npm run typecheck && npm run test`

---

## PHASE 5 — Tracking & telematics

### P5-T1 · Public tracking data view
- **Target files:** `supabase/migrations/006_tracking.sql`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, database abstraction only. Create a security-definer view `public_load_tracking` exposing only load_number, status, origin/destination city+state, delivery window, last_known_lat/lng, last_ping_at — never rates, margin, customer, or carrier identity. Add a function to resolve a tracking_token to that view row, plus a `tracking_events` table (load_id, event_type, lat, lng, created_at). Add token revocation support. No application code.
- **Gate:** `supabase db reset` clean; confirm the view leaks no financial columns.

### P5-T2 · Driver check-in page
- **Target files:** `app/track/[token]/page.tsx`, `components/tracking/driver-checkin.tsx`, `app/api/tracking/ping/route.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, tracking feature abstraction only. Build a tokenized, no-login driver page showing the load summary from public_load_tracking with buttons for Arrived at Pickup, Loaded, Arrived at Delivery, and Delivered. Each action posts a geolocation ping to the ping route, which validates the token, writes to tracking_events, and updates the load's last known position. Handle geolocation denial gracefully — allow manual status without coordinates. No dashboard changes.
- **Gate:** `npm run typecheck && npm run lint`, then smoke: open the token URL in a private window and post a ping.

### P5-T3 · Geofence auto-advance
- **Target files:** `supabase/functions/geofence-check/index.ts`, `lib/domain/geofence.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, domain plus edge-functions abstractions only. Create pure `isWithinRadius(point, target, meters)` and `resolveGeofenceTransition(load, ping)` in lib/domain/geofence.ts with Vitest tests. Then an Edge Function invoked on ping insert that advances load status when a geofence is crossed, writing an audit event. Respect the database transition guard — never bypass it.
- **Gate:** `npm run typecheck && npm run test`

### P5-T4 · Shipper tracking view
- **Target files:** `app/track/[token]/shipper/page.tsx`, `components/tracking/tracking-map.tsx`, `components/tracking/milestone-timeline.tsx`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, tracking feature abstraction only. Build a read-only shipper tracking view with a Leaflet map showing origin, destination, and last known position, plus a milestone timeline from tracking_events. Auto-refresh every 60 seconds. Never render rate, margin, or carrier pay. Do not modify the tracking API.
- **Gate:** `npm run typecheck && npm run lint`

---

## PHASE 6 — Financials, PDFs & settlements

### P6-T1 · Three-way match engine
- **Target files:** `lib/domain/three-way-match.ts`, `lib/domain/__tests__/three-way-match.test.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, domain abstraction only. Implement `evaluateThreeWayMatch({ agreedCarrierPay, invoicedAmount, podOnFile, approvedAccessorials })` returning a ThreeWayMatchResult with variance and human-readable reasons. Exact match required on the base rate; approved accessorials are added to the expected total. Vitest tests for exact match, over-bill, under-bill, missing POD, and accessorial cases. Pure functions only.
- **Gate:** `npm run typecheck && npm run test`

### P6-T2 · Invoice repository & generation
- **Target files:** `lib/repositories/invoices.ts`, `app/actions/generate-invoice.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, data-access abstraction only. Create the invoices repository (list, get, create, recordPayment, void) plus a server action `generateInvoice(loadId, invoiceType)` that builds a shipper invoice, carrier settlement voucher, or dispatcher commission invoice from load data, runs the three-way match for settlement vouchers, and assigns a sequential per-org invoice number without gaps. No PDF work here.
- **Gate:** `npm run typecheck && npm run lint`

### P6-T3 · PDF documents
- **Target files:** `components/pdf/rate-confirmation.tsx`, `components/pdf/invoice-document.tsx`, `app/api/pdf/[type]/[id]/route.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, pdf abstraction only. Build `@react-pdf/renderer` templates for the Rate Confirmation (load details, agreed rate, broker indemnity clauses, signature block) and Invoice (line items, totals, remit-to, terms), both branded from the organization record. Add a streaming API route that renders on demand, persists the PDF to Supabase Storage, and writes the URL back to the record — regenerating only when the source record has changed since the stored copy.
- **Gate:** `npm run typecheck && npm run lint`, then smoke: fetch the route and confirm a valid PDF plus a stored URL.

### P6-T4 · Settlement & commission workflows
- **Target files:** `app/(dashboard)/financials/settlements/page.tsx`, `app/(dashboard)/financials/commissions/page.tsx`, `components/financials/match-exception-panel.tsx`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, financials feature abstraction only. Build the settlement queue (broker mode) showing vouchers grouped by match state with an exception panel that displays the variance and its reasons and allows an override with a mandatory note written to audit_events. Build the weekly commission run (dispatcher mode) aggregating gross revenue per fleet truck for a selected week and generating one commission invoice per carrier. Reuse the existing repository and match engine.
- **Gate:** `npm run typecheck && npm run lint`

### P6-T5 · Dashboard KPIs
- **Target files:** `supabase/migrations/007_dashboard_views.sql`, `app/(dashboard)/page.tsx`, `components/dashboard/kpi-tile.tsx`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, dashboard feature abstraction only. Create org-scoped Postgres views `v_dashboard_broker` and `v_dashboard_dispatcher` computing the KPI set from section 1.1 of docs/TMS_MASTER_BLUEPRINT.md. Build the dashboard as a React Server Component rendering mode-aware KPI tiles, each deep-linking to a pre-filtered loads view. Compute nothing client-side over the full load set.
- **Gate:** `npm run typecheck && npm run lint`, then smoke: both modes render without a client-side data fetch waterfall.

### P6-T6 · Critical-path E2E tests
- **Target files:** `e2e/signup.spec.ts`, `e2e/load-lifecycle.spec.ts`, `e2e/ocr-review.spec.ts`
- **Prompt:**
  > Read `graphify-out/GRAPH_REPORT.md`, testing abstraction only. Write Playwright specs for three flows: signup creating an org and profile; create load → assign carrier → advance to delivered; upload a low-confidence document → appears in the review queue → accept fields → document completed. Use seeded fixtures and a dedicated test org. Do not modify application code to make tests pass — report failures instead.
- **Gate:** `npm run test:e2e`

---

## Post-Phase-6 backlog (do not launch without these)

1. **Stripe billing** — subscription per org, tier enforcement in middleware, trial expiry handling.
2. **BYOK settings vault UI** — masked inputs, per-service test buttons, AES-256-GCM at rest.
3. **Load board integration** — behind `LoadBoardProvider`, activated only when a DAT/Truckstop partnership is approved.
4. **QuickBooks Online sync** — OAuth2, payload mappers, bi-directional webhooks.
5. **Real carrier verification provider** — swap the mock for the licensed source you contract with.
6. **Public marketing site + sandbox demo** — landing page, ROI calculator, seeded ephemeral demo session.

---

## Sequencing rationale

Phases are ordered by dependency, not by visible progress. The schema and transition guard come first because every later phase writes against them, and retrofitting tenant isolation or status rules into a populated database is far more expensive than defining them up front. Pure domain logic (margin, compliance, matching, geofence) is always built and tested before the UI that consumes it, so the rules have one home and one test suite. Providers for carrier verification and load boards are interfaces with mocks from day one, because their real implementations depend on commercial agreements whose timing is outside your control — the build must not stall waiting on a contract.