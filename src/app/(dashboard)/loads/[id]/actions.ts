"use server";

import { revalidatePath } from "next/cache";
import { getNextStatus } from "@/lib/domain/load-status";
import { getLoadById, updateLoadStatus, assignCarrier, updateDriverInfo } from "@/lib/repositories/loads";
import { createShipperInvoiceIfMissing } from "@/lib/repositories/invoices";
import { driverDispatchSchema, type DriverDispatchValues } from "@/lib/validations/load";
import type { Load, UUID } from "../../../../../types/domain";

// Additive, backward-compatible: still structurally a Load (every existing
// field a caller reads, e.g. `updated.status`, is unchanged), with one
// optional extra field a caller can opt into reading. This lets the invoice
// failure be surfaced without changing what existing callers (e.g.
// components/loads/status-progression-bar.tsx) already do with the result.
export type AdvanceLoadStatusResult = Load & { invoiceWarning?: string };

export async function advanceLoadStatus(loadId: UUID): Promise<AdvanceLoadStatusResult> {
  const current = await getLoadById(loadId);
  if (!current) {
    throw new Error("Load not found");
  }

  const next = getNextStatus(current.status);
  if (!next) {
    throw new Error(`Load ${loadId} has no legal next status from "${current.status}"`);
  }

  const updated = await updateLoadStatus(loadId, next);

  // Self-serve automation: when a load transitions to delivered, try to
  // auto-create its shipper invoice. This is a warning, not a gate -- a
  // billing-side failure must never block or roll back the status
  // transition a driver/ops person just made, so this never throws out of
  // advanceLoadStatus. It previously only logged the failure
  // (console.error, no trace visible anywhere else) and returned as if
  // nothing had gone wrong; the failure reason is now also attached to the
  // return value so the caller can show it to the user instead of the
  // invoice silently never existing.
  let invoiceWarning: string | undefined;
  if (next === "delivered") {
    try {
      await createShipperInvoiceIfMissing(loadId);
      revalidatePath("/invoices");
    } catch (invErr) {
      const message = invErr instanceof Error ? invErr.message : String(invErr);
      console.error("Auto-invoice creation failed:", invErr);
      invoiceWarning = `Delivered, but invoice creation failed — please generate it manually from the Invoices page. (${message})`;
    }
  }

  revalidatePath(`/loads/${loadId}`);
  revalidatePath("/loads");
  revalidatePath("/invoices");

  return invoiceWarning ? { ...updated, invoiceWarning } : updated;
}

export async function assignCarrierToLoad(loadId: UUID, carrierId: UUID): Promise<Load> {
  const updated = await assignCarrier(loadId, carrierId);
  revalidatePath(`/loads/${loadId}`);
  revalidatePath("/loads");
  return updated;
}

export async function updateLoadDriverInfo(loadId: UUID, values: DriverDispatchValues): Promise<Load> {
  const parsed = driverDispatchSchema.parse(values);

  const updated = await updateDriverInfo(loadId, {
    driverName: parsed.driverName || null,
    driverPhone: parsed.driverPhone || null,
    truckNumber: parsed.truckNumber || null,
    trailerNumber: parsed.trailerNumber || null,
  });

  revalidatePath(`/loads/${loadId}`);
  revalidatePath("/loads");
  return updated;
}
