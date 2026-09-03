"use server";

import { revalidatePath } from "next/cache";

import { getLoadById } from "@/lib/repositories/loads";
import { listDocumentsByLoadId } from "@/lib/repositories/documents";
import { createInvoice, listInvoices } from "@/lib/repositories/invoices";
import { getCarrierById } from "@/lib/repositories/carriers";
import { performThreeWayMatch } from "@/lib/domain/three-way-match";
import { formatCents } from "@/lib/money";
import type { Invoice, LoadStatus, UUID } from "../../../../types/domain";

const SETTLEABLE_STATUSES: LoadStatus[] = ["delivered", "pod_uploaded"];

// Tenant scoping relies entirely on the RLS-guarded repository calls below
// (getLoadById / listDocumentsByLoadId / createInvoice resolve org_id
// server-side from the caller's own profile) — no org_id is ever accepted
// from the client.
export async function generateSettlementAction(loadId: UUID): Promise<Invoice> {
  const load = await getLoadById(loadId);

  if (!load) {
    throw new Error("Load not found");
  }
  if (!SETTLEABLE_STATUSES.includes(load.status)) {
    throw new Error("Load must be delivered before a settlement can be generated");
  }

  const documents = await listDocumentsByLoadId(loadId);
  const podVerified = documents.some((doc) => doc.documentType === "POD" && doc.isVerified);

  const match = performThreeWayMatch(load.carrierPay, load.carrierPay, podVerified, 0);
  if (!match.matched) {
    throw new Error(`Three-way match failed: ${match.discrepancies.join("; ")}`);
  }

  const invoice = await createInvoice({
    loadId: load.id,
    carrierId: load.carrierId,
    invoiceType: "carrier_settlement_voucher",
    amountTotal: load.carrierPay,
  });

  revalidatePath("/settlements");

  return invoice;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportSettlementsCsvAction(): Promise<string> {
  const { data: invoices } = await listInvoices({}, { page: 1, pageSize: 1000 });
  const settlements = invoices.filter(
    (invoice) => invoice.invoiceType === "carrier_settlement_voucher"
  );

  const loadIds = Array.from(
    new Set(settlements.map((invoice) => invoice.loadId).filter((id): id is string => !!id))
  );
  const loads = await Promise.all(loadIds.map((id) => getLoadById(id)));
  const loadsById = new Map(loads.filter((load) => load !== null).map((load) => [load.id, load]));

  const carrierIds = Array.from(
    new Set(
      Array.from(loadsById.values())
        .map((load) => load.carrierId)
        .filter((id): id is string => !!id)
    )
  );
  const carriers = await Promise.all(carrierIds.map((id) => getCarrierById(id)));
  const carriersById = new Map(
    carriers.filter((carrier) => carrier !== null).map((carrier) => [carrier.id, carrier])
  );

  const rows = ["Load ID,Carrier,Amount Paid,Date"];
  for (const invoice of settlements) {
    const load = invoice.loadId ? loadsById.get(invoice.loadId) : undefined;
    const carrier = load?.carrierId ? carriersById.get(load.carrierId) : undefined;

    rows.push(
      [
        csvEscape(invoice.loadId ?? ""),
        csvEscape(carrier?.companyName ?? ""),
        csvEscape(formatCents(invoice.amountTotal)),
        csvEscape(invoice.issueDate),
      ].join(",")
    );
  }

  return rows.join("\n");
}
