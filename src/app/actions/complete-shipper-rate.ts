"use server";

import { revalidatePath } from "next/cache";
import { completeShipperRate } from "@/lib/repositories/loads";
import type { Load, UUID } from "../../../types/domain";

// Additive: completeShipperRate (src/lib/repositories/loads.ts) is a plain
// repository function backed by the server-only Supabase client -- it has
// no "use server" boundary of its own (same as createLoad, assignCarrier,
// etc.), so it cannot be called directly from a client component. This is
// the thin Server Action wrapper the RateCon review modal calls instead.
export async function completeShipperRateAction(
  loadId: UUID,
  shipperRateCents: number
): Promise<Load> {
  const updated = await completeShipperRate(loadId, shipperRateCents);
  revalidatePath(`/loads/${loadId}`);
  revalidatePath("/loads");
  return updated;
}
