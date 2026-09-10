import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Load, LoadStop } from "../../../types/domain";

const mockGetLoadById = vi.fn();

vi.mock("@/lib/repositories/loads", () => ({
  getLoadById: (...args: unknown[]) => mockGetLoadById(...args),
  listLoads: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

interface FakeQueryResult {
  data: unknown;
  error: unknown;
  count?: number;
}

function makeSelectBuilder(result: FakeQueryResult) {
  const builder: Record<string, unknown> = {};
  builder.select = () => builder;
  builder.eq = () => builder;
  builder.order = () => builder;
  builder.range = () => builder;
  builder.single = () => Promise.resolve({ data: result.data, error: result.error });
  // listInvoices() awaits the query directly (no .single()), so the builder
  // itself must be thenable.
  builder.then = (resolve: (value: FakeQueryResult) => void) =>
    resolve({ data: result.data, error: result.error, count: result.count });
  return builder;
}

function makeInsertBuilder(
  result: FakeQueryResult,
  onInsert: (payload: Record<string, unknown>) => void
) {
  const builder: Record<string, unknown> = {};
  builder.insert = (payload: Record<string, unknown>) => {
    onInsert(payload);
    return builder;
  };
  builder.select = () => builder;
  builder.single = () => Promise.resolve({ data: result.data, error: result.error });
  return builder;
}

function makeProfilesBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  builder.select = () => builder;
  builder.eq = () => builder;
  builder.single = () => Promise.resolve({ data: result.data, error: result.error });
  return builder;
}

// Mocks just enough of the Supabase client shape that listInvoices() and
// createInvoice() (both real, unmocked, in lib/repositories/invoices.ts)
// exercise their actual control flow -- only the query results are faked.
// createShipperInvoiceIfMissing always calls .from("invoices") for the
// existing-invoice check first; a second .from("invoices") call only
// happens if that check finds nothing and it proceeds to insert.
function makeFakeSupabase(options: {
  existingInvoicesResult: FakeQueryResult;
  insertResult?: FakeQueryResult;
  onInsert?: (payload: Record<string, unknown>) => void;
}) {
  let invoicesCallCount = 0;

  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }),
    },
    from: (table: string) => {
      if (table === "profiles") {
        return makeProfilesBuilder({ data: { org_id: "org-1" }, error: null });
      }
      if (table === "invoices") {
        invoicesCallCount += 1;
        if (invoicesCallCount === 1) {
          return makeSelectBuilder(options.existingInvoicesResult);
        }
        return makeInsertBuilder(
          options.insertResult ?? { data: null, error: null },
          options.onInsert ?? (() => {})
        );
      }
      throw new Error(`Unexpected table in test: ${table}`);
    },
  };
}

const LOAD_ORIGIN: LoadStop = {
  facilityName: "Origin Facility",
  address: "1 Main St",
  city: "Chicago",
  state: "IL",
  zip: "60601",
  windowStart: "2026-01-01T00:00:00.000Z",
  windowEnd: null,
};

function makeFakeLoad(overrides: Partial<Load> = {}): Load {
  return {
    id: "load-1",
    orgId: "org-1",
    loadNumber: "L-000001",
    status: "delivered",
    customerId: "customer-1",
    carrierId: null,
    createdByUserId: null,
    shipperRate: 420000,
    carrierPay: 0,
    brokerMargin: 420000,
    dispatcherCommissionEarned: 0,
    equipmentType: "Dry Van",
    weightLbs: null,
    commodity: null,
    temperatureSetting: null,
    specialInstructions: null,
    customerPoNumber: null,
    origin: LOAD_ORIGIN,
    destination: LOAD_ORIGIN,
    trackingToken: "token-1",
    driverName: null,
    driverPhone: null,
    truckNumber: null,
    trailerNumber: null,
    lastKnownLat: null,
    lastKnownLng: null,
    lastPingAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeFakeInvoiceRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "invoice-1",
    org_id: "org-1",
    load_id: "load-1",
    customer_id: "customer-1",
    carrier_id: null,
    invoice_type: "shipper_invoice",
    payment_status: "pending",
    amount_total: "4200.00",
    amount_paid: "0.00",
    amount_due: "4200.00",
    due_date: "2026-02-01",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("createShipperInvoiceIfMissing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an invoice with a due date 30 days out when none exists yet", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const { createShipperInvoiceIfMissing } = await import("./invoices");

    mockGetLoadById.mockResolvedValue(makeFakeLoad({ shipperRate: 420000 }));

    let capturedInsertPayload: Record<string, unknown> | undefined;
    vi.mocked(createClient).mockResolvedValue(
      makeFakeSupabase({
        existingInvoicesResult: { data: [], error: null, count: 0 },
        insertResult: { data: makeFakeInvoiceRow(), error: null },
        onInsert: (payload) => {
          capturedInsertPayload = payload;
        },
      }) as never
    );

    const beforeMs = Date.now();
    const result = await createShipperInvoiceIfMissing("load-1");
    const afterMs = Date.now();

    expect(result.created).toBe(true);
    expect(result.alreadyExisted).toBeUndefined();
    expect(result.invoice?.id).toBe("invoice-1");

    // The actual payload sent to the insert -- not the (fixture) row
    // echoed back -- is what proves the function itself computed a real
    // due date rather than leaving it undefined/null, which is the
    // regression this fix addresses (the old manual-dialog path never
    // passed dueDate at all).
    expect(capturedInsertPayload).toBeDefined();
    expect(capturedInsertPayload!.amount_total).toBe(4200);
    expect(typeof capturedInsertPayload!.due_date).toBe("string");

    const dueDateMs = new Date(capturedInsertPayload!.due_date as string).getTime();
    const expectedMinMs = beforeMs + 30 * 86400000 - 86400000; // date-only rounding tolerance
    const expectedMaxMs = afterMs + 30 * 86400000 + 86400000;
    expect(dueDateMs).toBeGreaterThanOrEqual(expectedMinMs);
    expect(dueDateMs).toBeLessThanOrEqual(expectedMaxMs);
  });

  it("returns alreadyExisted and does not create a duplicate when a shipper invoice already exists", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const { createShipperInvoiceIfMissing } = await import("./invoices");

    mockGetLoadById.mockResolvedValue(makeFakeLoad());

    let insertWasCalled = false;
    const existingRow = makeFakeInvoiceRow({ id: "existing-invoice" });
    vi.mocked(createClient).mockResolvedValue(
      makeFakeSupabase({
        existingInvoicesResult: { data: [existingRow], error: null, count: 1 },
        onInsert: () => {
          insertWasCalled = true;
        },
      }) as never
    );

    const result = await createShipperInvoiceIfMissing("load-1");

    expect(result.created).toBe(false);
    expect(result.alreadyExisted).toBe(true);
    expect(result.invoice?.id).toBe("existing-invoice");
    expect(insertWasCalled).toBe(false);
  });
});
