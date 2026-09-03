"use server";

import { revalidatePath } from "next/cache";

import { getLoadById } from "@/lib/repositories/loads";
import { createInvoice } from "@/lib/repositories/invoices";
import type { Invoice, LoadStatus, UUID } from "../../../../types/domain";

const INVOICEABLE_STATUSES: LoadStatus[] = ["delivered", "pod_uploaded"];

// Tenant scoping relies entirely on the RLS-guarded repository calls below
// (getLoadById / createInvoice resolve org_id server-side from the caller's
// own profile) — no org_id is ever accepted from the client.
export async function generateInvoiceAction(loadId: UUID): Promise<Invoice> {
  const load = await getLoadById(loadId);

  if (!load) {
    throw new Error("Load not found");
  }
  if (!INVOICEABLE_STATUSES.includes(load.status)) {
    throw new Error("Load must be delivered before an invoice can be generated");
  }

  const invoice = await createInvoice({
    loadId: load.id,
    customerId: load.customerId,
    invoiceType: "shipper_invoice",
    amountTotal: load.shipperRate,
  });

  revalidatePath("/invoices");

  return invoice;
}
