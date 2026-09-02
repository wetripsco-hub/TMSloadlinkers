"use server";

import { revalidatePath } from "next/cache";

import { getNextStatus } from "@/lib/domain/load-status";
import { getLoadById, updateLoadStatus } from "@/lib/repositories/loads";
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
  revalidatePath(`/loads/${loadId}`);
  revalidatePath("/loads");

  return updated;
}
