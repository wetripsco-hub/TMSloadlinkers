"use server";

import { revalidatePath } from "next/cache";
import { getNextStatus } from "@/lib/domain/load-status";
import { getLoadById, updateLoadStatus, assignCarrier } from "@/lib/repositories/loads";
import { createInvoice, listInvoices } from "@/lib/repositories/invoices";
import type { Load, UUID } from "../../../../../types/domain";

export async function advanceLoadStatus(loadId: UUID): Promise<Load> {
  const current = await getLoadById(loadId);
  if (!current) {
    throw new Error("Load not found");
  }

  const next = getNextStatus(current.status);
  if (!next) {
    throw new Error(`Load ${loadId} has no legal next status from "${current.status}"`);
  }

  const updated = await updateLoadStatus(loadId, next);

  // Self-serve automation: When load transitions to delivered, automatically create shipper invoice
  if (next === "delivered") {
    try {
      const existing = await listInvoices({ loadId }, { page: 1, pageSize: 20 });
      const hasShipperInvoice = existing.data.some(
        (inv) => inv.invoiceType === "shipper_invoice"
      );

      if (!hasShipperInvoice) {
        await createInvoice({
          loadId: updated.id,
          customerId: updated.customerId,
          invoiceType: "shipper_invoice",
          amountTotal: updated.shipperRate,
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        });
        revalidatePath("/invoices");
      }
    } catch (invErr) {
      console.error("Auto-invoice creation note:", invErr);
    }
  }

  revalidatePath(`/loads/${loadId}`);
  revalidatePath("/loads");
  revalidatePath("/invoices");

  return updated;
}

export async function assignCarrierToLoad(loadId: UUID, carrierId: UUID): Promise<Load> {
  const updated = await assignCarrier(loadId, carrierId);
  revalidatePath(`/loads/${loadId}`);
  revalidatePath("/loads");
  return updated;
}
