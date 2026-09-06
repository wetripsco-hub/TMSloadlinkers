"use server";

import { revalidatePath } from "next/cache";
import { createLoad } from "@/lib/repositories/loads";
import { linkDocumentToLoad } from "@/lib/repositories/documents";
import { parseCents } from "@/lib/money";
import { rateconReviewSchema, type RateConReviewValues } from "@/lib/validations/ratecon-review";
import type { UUID } from "../../../types/domain";

export interface CreateLoadFromRateConReviewResult {
  loadId: UUID;
}

// Additive: unlike createLoadFromDocument (left in place, unused), this
// takes the user's edited/confirmed field values -- including a real
// shipperRate the reviewer typed in -- and creates the load with a single
// createLoad() call, needs_shipper_rate explicitly false since every field
// createLoad requires is already filled in by this point.
export async function createLoadFromRateConReview(
  documentId: UUID,
  fields: RateConReviewValues
): Promise<CreateLoadFromRateConReviewResult> {
  const parsed = rateconReviewSchema.parse(fields);

  const load = await createLoad({
    customerId: null,
    carrierId: null,
    origin: parsed.origin,
    destination: parsed.destination,
    pickupDate: parsed.pickupDate || null,
    deliveryDate: parsed.deliveryDate || null,
    shipperRate: parseCents(parsed.shipperRate),
    carrierPay: parseCents(parsed.carrierPay),
    equipmentType: parsed.equipmentType || null,
    commodity: parsed.commodity || null,
    weightLbs: parsed.weightLbs ? Number(parsed.weightLbs) : null,
    needsShipperRate: false,
  });

  await linkDocumentToLoad(documentId, load.id);

  revalidatePath(`/loads/${load.id}`);
  revalidatePath("/loads");

  return { loadId: load.id };
}
