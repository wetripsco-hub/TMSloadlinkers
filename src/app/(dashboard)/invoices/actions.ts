"use server";

import { revalidatePath } from "next/cache";

import { getLoadById } from "@/lib/repositories/loads";
import {
  createShipperInvoiceIfMissing,
  isLoadEligibleForShipperInvoice,
  listLoadsEligibleForShipperInvoice,
} from "@/lib/repositories/invoices";
import type { Invoice, Load, UUID } from "../../../../types/domain";

// Tenant scoping relies entirely on the RLS-guarded repository calls below
// (getLoadById / createShipperInvoiceIfMissing resolve org_id server-side
// from the caller's own profile) — no org_id is ever accepted from the
// client.
export async function generateInvoiceAction(loadId: UUID): Promise<Invoice> {
  const load = await getLoadById(loadId);

  if (!load) {
    throw new Error("Load not found");
  }
  if (!isLoadEligibleForShipperInvoice(load.status)) {
    throw new Error("Load must have reached at least POD uploaded before an invoice can be generated");
  }

  // createShipperInvoiceIfMissing is the same idempotency-checked,
  // due-date-computing function advanceLoadStatus's delivered-transition
  // side effect uses — this both fixes the manual dialog's missing
  // duplicate check and gives it a real due_date, and means the two
  // creation paths can no longer drift apart.
  const result = await createShipperInvoiceIfMissing(loadId);

  revalidatePath("/invoices");

  if (!result.invoice) {
    throw new Error("Could not create or find an invoice for this load");
  }

  return result.invoice;
}

// Refetched by the dialog every time it opens (see generate-invoice-dialog.tsx)
// rather than relying solely on the server-rendered eligibleLoads prop from
// app/(dashboard)/invoices/page.tsx, whose "delivered or pod_uploaded" filter
// predates the no-existing-invoice check and doesn't cover loads already at
// invoiced/settled that are still missing one.
export async function listInvoiceEligibleLoadsAction(): Promise<Load[]> {
  return listLoadsEligibleForShipperInvoice();
}
