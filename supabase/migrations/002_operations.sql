-- 002_operations.sql
-- Operations schema: customers, carriers, loads, load documents, invoices.

-- ============================================================================
-- Enums
-- ============================================================================

create type load_operational_status as enum (
  'draft',
  'booked',
  'dispatched',
  'in_transit',
  'delivered',
  'completed',
  'cancelled'
);

create type invoice_type_enum as enum ('shipper_invoice', 'carrier_settlement');

create type payment_status_enum as enum ('pending', 'partial', 'paid', 'overdue', 'cancelled');

-- ============================================================================
-- Tables
-- ============================================================================

create table customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  billing_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_org_id_idx on customers (org_id);

create table carriers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  mc_number text,
  dot_number text,
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index carriers_org_id_idx on carriers (org_id);

create table loads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  customer_id uuid references customers (id) on delete set null,
  carrier_id uuid references carriers (id) on delete set null,
  status load_operational_status not null default 'draft',
  origin text,
  destination text,
  pickup_date timestamptz,
  delivery_date timestamptz,
  shipper_rate numeric(12, 2) not null default 0,
  carrier_pay numeric(12, 2) not null default 0,
  broker_margin numeric(12, 2) generated always as (shipper_rate - carrier_pay) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index loads_org_id_status_idx on loads (org_id, status);

create table load_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  load_id uuid not null references loads (id) on delete cascade,
  document_type text,
  file_url text,
  ocr_status text not null default 'pending'
    check (ocr_status in ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index load_documents_org_id_ocr_status_idx on load_documents (org_id, ocr_status);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  load_id uuid references loads (id) on delete set null,
  customer_id uuid references customers (id) on delete set null,
  carrier_id uuid references carriers (id) on delete set null,
  invoice_type invoice_type_enum not null,
  payment_status payment_status_enum not null default 'pending',
  amount_total numeric(12, 2) not null default 0,
  amount_paid numeric(12, 2) not null default 0,
  amount_due numeric(12, 2) generated always as (amount_total - amount_paid) stored,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invoices_org_id_idx on invoices (org_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table customers enable row level security;
alter table carriers enable row level security;
alter table loads enable row level security;
alter table load_documents enable row level security;
alter table invoices enable row level security;

-- customers: full CRUD is scoped to the caller's own org, looked up from
-- their profile row. Insert/update checks pin org_id to that same org so a
-- caller cannot attach or move a row into a different tenant.
create policy "customers_select_own_org"
  on customers for select
  using (org_id = (select org_id from profiles where profiles.id = auth.uid()));

create policy "customers_insert_own_org"
  on customers for insert
  with check (org_id = (select org_id from profiles where profiles.id = auth.uid()));

create policy "customers_update_own_org"
  on customers for update
  using (org_id = (select org_id from profiles where profiles.id = auth.uid()))
  with check (org_id = (select org_id from profiles where profiles.id = auth.uid()));

create policy "customers_delete_own_org"
  on customers for delete
  using (org_id = (select org_id from profiles where profiles.id = auth.uid()));

-- carriers: same org-scoped CRUD shape as customers.
create policy "carriers_select_own_org"
  on carriers for select
  using (org_id = (select org_id from profiles where profiles.id = auth.uid()));

create policy "carriers_insert_own_org"
  on carriers for insert
  with check (org_id = (select org_id from profiles where profiles.id = auth.uid()));

create policy "carriers_update_own_org"
  on carriers for update
  using (org_id = (select org_id from profiles where profiles.id = auth.uid()))
  with check (org_id = (select org_id from profiles where profiles.id = auth.uid()));

create policy "carriers_delete_own_org"
  on carriers for delete
  using (org_id = (select org_id from profiles where profiles.id = auth.uid()));

-- loads: same org-scoped CRUD shape as customers/carriers. customer_id and
-- carrier_id are left unconstrained by policy (they already point at rows
-- the RLS on those tables restricts to the same org via application logic).
create policy "loads_select_own_org"
  on loads for select
  using (org_id = (select org_id from profiles where profiles.id = auth.uid()));

create policy "loads_insert_own_org"
  on loads for insert
  with check (org_id = (select org_id from profiles where profiles.id = auth.uid()));

create policy "loads_update_own_org"
  on loads for update
  using (org_id = (select org_id from profiles where profiles.id = auth.uid()))
  with check (org_id = (select org_id from profiles where profiles.id = auth.uid()));

create policy "loads_delete_own_org"
  on loads for delete
  using (org_id = (select org_id from profiles where profiles.id = auth.uid()));

-- load_documents: same org-scoped CRUD shape, org_id is denormalized onto
-- the row (rather than joined through loads) so the policy stays a single
-- cheap lookup instead of a join through loads on every access.
create policy "load_documents_select_own_org"
  on load_documents for select
  using (org_id = (select org_id from profiles where profiles.id = auth.uid()));

create policy "load_documents_insert_own_org"
  on load_documents for insert
  with check (org_id = (select org_id from profiles where profiles.id = auth.uid()));

create policy "load_documents_update_own_org"
  on load_documents for update
  using (org_id = (select org_id from profiles where profiles.id = auth.uid()))
  with check (org_id = (select org_id from profiles where profiles.id = auth.uid()));

create policy "load_documents_delete_own_org"
  on load_documents for delete
  using (org_id = (select org_id from profiles where profiles.id = auth.uid()));

-- invoices: same org-scoped CRUD shape as the other operational tables.
create policy "invoices_select_own_org"
  on invoices for select
  using (org_id = (select org_id from profiles where profiles.id = auth.uid()));

create policy "invoices_insert_own_org"
  on invoices for insert
  with check (org_id = (select org_id from profiles where profiles.id = auth.uid()));

create policy "invoices_update_own_org"
  on invoices for update
  using (org_id = (select org_id from profiles where profiles.id = auth.uid()))
  with check (org_id = (select org_id from profiles where profiles.id = auth.uid()));

create policy "invoices_delete_own_org"
  on invoices for delete
  using (org_id = (select org_id from profiles where profiles.id = auth.uid()));
