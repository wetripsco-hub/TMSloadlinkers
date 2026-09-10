import { createClient } from "@/lib/supabase/server";
import { parseCents, formatCents } from "@/lib/money";
import { getLoadById, listLoads } from "@/lib/repositories/loads";
import { LOAD_STATUS_FORWARD_CHAIN } from "@/lib/domain/load-status";
import type { Cents, Invoice, InvoiceType, Load, LoadStatus, PaymentStatus, UUID } from "../../../types/domain";

// The `invoices` table does not yet persist every field on the Invoice
// domain interface (invoiceNumber, billToName/Email, issueDate,
// threeWayMatched, pdfDownloadUrl). Those fields are filled with safe
// defaults below until the schema catches up. `invoice_type_enum` and
// `payment_status_enum` also carry fewer values than the domain's
// InvoiceType/PaymentStatus unions, so row <-> domain conversion goes
// through explicit maps rather than a 1:1 cast.

type DbInvoiceType = "shipper_invoice" | "carrier_settlement";
type DbPaymentStatus = "pending" | "partial" | "paid" | "overdue" | "cancelled";

interface InvoiceRow {
  id: string;
  org_id: string;
  load_id: string | null;
  customer_id: string | null;
  carrier_id: string | null;
  invoice_type: DbInvoiceType;
  payment_status: DbPaymentStatus;
  amount_total: number;
  amount_paid: number;
  amount_due: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

const INVOICE_COLUMNS =
  "id, org_id, load_id, customer_id, carrier_id, invoice_type, payment_status, amount_total, amount_paid, amount_due, due_date, created_at, updated_at";

function moneyToCents(value: number): Cents {
  return parseCents(String(value));
}

function centsToMoney(cents: Cents): string {
  return formatCents(cents).replace(/[$,]/g, "");
}

function dbInvoiceTypeToDomain(type: DbInvoiceType): InvoiceType {
  return type === "carrier_settlement" ? "carrier_settlement_voucher" : "shipper_invoice";
}

// `dispatcher_carrier_commission` has no backing enum value yet, so writes
// with that type are rejected rather than silently coerced.
function domainInvoiceTypeToDb(type: InvoiceType): DbInvoiceType {
  if (type === "shipper_invoice") return "shipper_invoice";
  if (type === "carrier_settlement_voucher") return "carrier_settlement";
  throw new Error(`Invoice type "${type}" is not yet supported by the invoices table`);
}

// `overdue` has no direct PaymentStatus equivalent; it is surfaced as
// "unpaid" since the invoice is, at minimum, not yet paid.
function dbPaymentStatusToDomain(status: DbPaymentStatus): PaymentStatus {
  switch (status) {
    case "pending":
      return "unpaid";
    case "partial":
      return "partially_paid";
    case "paid":
      return "paid";
    case "overdue":
      return "unpaid";
    case "cancelled":
      return "void";
  }
}

function mapRowToInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    orgId: row.org_id,
    loadId: row.load_id,
    invoiceNumber: "",
    invoiceType: dbInvoiceTypeToDomain(row.invoice_type),
    billToName: "",
    billToEmail: null,
    amountTotal: moneyToCents(row.amount_total),
    amountPaid: moneyToCents(row.amount_paid),
    amountDue: moneyToCents(row.amount_due),
    issueDate: row.created_at,
    dueDate: row.due_date ?? "",
    status: dbPaymentStatusToDomain(row.payment_status),
    threeWayMatched: false,
    pdfDownloadUrl: null,
    customerId: row.customer_id,
    carrierId: row.carrier_id,
  };
}

export interface ListInvoicesFilters {
  loadId?: UUID;
  customerId?: UUID;
  carrierId?: UUID;
  status?: PaymentStatus;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface ListInvoicesResult {
  data: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateInvoiceInput {
  loadId?: UUID | null;
  customerId?: UUID | null;
  carrierId?: UUID | null;
  invoiceType: InvoiceType;
  amountTotal: Cents;
  dueDate?: string | null;
}

const DOMAIN_TO_DB_STATUS: Record<PaymentStatus, DbPaymentStatus> = {
  unpaid: "pending",
  partially_paid: "partial",
  paid: "paid",
  factored: "partial",
  void: "cancelled",
};

// All queries below rely on Postgres RLS (policies scoped to
// `profiles.org_id` for the calling user) for tenant isolation. org_id is
// never accepted as a parameter; on writes it is resolved server-side from
// the caller's own profile so a caller cannot target another tenant.
async function getCurrentOrgId(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<UUID> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!error && data?.org_id) {
    return data.org_id;
  }

  const { ensureUserOrganization } = await import("@/lib/services/ensure-user-organization");
  const fallbackOrgId = await ensureUserOrganization(supabase);
  if (fallbackOrgId) {
    return fallbackOrgId;
  }

  throw new Error("No organization found for current user profile");
}

export async function listInvoices(
  filters: ListInvoicesFilters,
  pagination: Pagination
): Promise<ListInvoicesResult> {
  const supabase = await createClient();
  const { page, pageSize } = pagination;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("invoices")
    .select(INVOICE_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.loadId) {
    query = query.eq("load_id", filters.loadId);
  }
  if (filters.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }
  if (filters.carrierId) {
    query = query.eq("carrier_id", filters.carrierId);
  }
  if (filters.status) {
    query = query.eq("payment_status", DOMAIN_TO_DB_STATUS[filters.status]);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    data: (data as unknown as InvoiceRow[]).map(mapRowToInvoice),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getInvoiceById(id: UUID): Promise<Invoice | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select(INVOICE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  return mapRowToInvoice(data as unknown as InvoiceRow);
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      org_id: orgId,
      load_id: input.loadId ?? null,
      customer_id: input.customerId ?? null,
      carrier_id: input.carrierId ?? null,
      invoice_type: domainInvoiceTypeToDb(input.invoiceType),
      amount_total: Number(centsToMoney(input.amountTotal)),
      due_date: input.dueDate ?? null,
    })
    .select(INVOICE_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToInvoice(data as unknown as InvoiceRow);
}

// "Reached at least pod_uploaded" == pod_uploaded, invoiced, or settled in
// the forward chain (lib/domain/load-status.ts). A load that hasn't been
// delivered/POD'd yet isn't billing-ready; 'cancelled' sits outside the
// forward chain entirely (indexOf === -1) and is correctly excluded too.
const POD_UPLOADED_CHAIN_INDEX = LOAD_STATUS_FORWARD_CHAIN.indexOf("pod_uploaded" as LoadStatus);

export function isLoadEligibleForShipperInvoice(status: LoadStatus): boolean {
  const index = LOAD_STATUS_FORWARD_CHAIN.indexOf(status);
  return index !== -1 && index >= POD_UPLOADED_CHAIN_INDEX;
}

// Loads that have reached at least pod_uploaded and have no shipper_invoice
// yet -- this is what the manual "Generate invoice" dialog should offer.
// Deliberately includes loads already at invoiced/settled that are missing
// their invoice (e.g. because the automatic delivered-transition attempt in
// advanceLoadStatus failed silently) so they can be manually backfilled;
// the old filter (status in delivered/pod_uploaded only, with no check
// against existing invoices) neither excluded already-invoiced loads nor
// included later-stage loads still missing one.
export async function listLoadsEligibleForShipperInvoice(): Promise<Load[]> {
  const eligibleStatuses = LOAD_STATUS_FORWARD_CHAIN.slice(POD_UPLOADED_CHAIN_INDEX);

  const results = await Promise.all(
    eligibleStatuses.map((status) => listLoads({ status }, { page: 1, pageSize: 100 }))
  );
  const candidates = results.flatMap((result) => result.data);
  if (candidates.length === 0) {
    return [];
  }

  const { data: invoices } = await listInvoices({}, { page: 1, pageSize: 500 });
  const loadIdsWithShipperInvoice = new Set(
    invoices
      .filter((invoice) => invoice.invoiceType === "shipper_invoice" && invoice.loadId)
      .map((invoice) => invoice.loadId as string)
  );

  return candidates.filter((load) => !loadIdsWithShipperInvoice.has(load.id));
}

export interface CreateShipperInvoiceIfMissingResult {
  created: boolean;
  invoice?: Invoice;
  alreadyExisted?: boolean;
}

// Single source of truth for "does this load already have a shipper
// invoice, and if not, create one" -- both the manual Generate Invoice
// dialog (generateInvoiceAction) and the automatic delivered-transition
// side effect (advanceLoadStatus) call this instead of each duplicating
// (and drifting from) their own idempotency-check and due-date logic.
export async function createShipperInvoiceIfMissing(
  loadId: UUID
): Promise<CreateShipperInvoiceIfMissingResult> {
  const load = await getLoadById(loadId);
  if (!load) {
    throw new Error("Load not found");
  }

  const existing = await listInvoices({ loadId }, { page: 1, pageSize: 20 });
  const existingShipperInvoice = existing.data.find(
    (invoice) => invoice.invoiceType === "shipper_invoice"
  );

  if (existingShipperInvoice) {
    return { created: false, alreadyExisted: true, invoice: existingShipperInvoice };
  }

  const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const invoice = await createInvoice({
    loadId: load.id,
    customerId: load.customerId,
    invoiceType: "shipper_invoice",
    amountTotal: load.shipperRate,
    dueDate,
  });

  return { created: true, invoice };
}
