"use server";

import { revalidatePath } from "next/cache";
import { getNextStatus } from "@/lib/domain/load-status";
import { getLoadById, updateLoadStatus, assignCarrier, updateDriverInfo } from "@/lib/repositories/loads";
import { createShipperInvoiceIfMissing } from "@/lib/repositories/invoices";
import {
  listLoadNotes as listLoadNotesRow,
  insertStaffLoadNote,
  markLoadNotesRead as markLoadNotesReadRow,
} from "@/lib/repositories/load-notes";
import { driverDispatchSchema, type DriverDispatchValues } from "@/lib/validations/load";
import { createClient } from "@/lib/supabase/server";
import type { Load, LoadNote, UUID } from "../../../../../types/domain";

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

export async function listLoadNotes(loadId: UUID): Promise<LoadNote[]> {
  return listLoadNotesRow(loadId);
}

// author_label is always the caller's own profile name, resolved
// server-side (same auth.getUser() + profiles lookup pattern as
// uploadLoadDocument, loads/[id]/documents/actions.ts) -- never taken from
// client input, so a staff note can't be posted under someone else's name.
export async function addLoadNote(loadId: UUID, text: string): Promise<LoadNote> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Note cannot be empty");
  }
  if (trimmed.length > 500) {
    throw new Error("Note must be 500 characters or fewer");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("org_id, full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.org_id) {
    throw new Error("No profile found for the current user");
  }

  const note = await insertStaffLoadNote(
    loadId,
    profile.org_id,
    user.id,
    profile.full_name || "Staff",
    trimmed
  );

  revalidatePath(`/loads/${loadId}`);
  return note;
}

export async function markLoadNotesRead(loadId: UUID): Promise<void> {
  await markLoadNotesReadRow(loadId);
  revalidatePath(`/loads/${loadId}`);
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
