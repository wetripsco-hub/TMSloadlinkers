"use server";

import { createClient } from "@/lib/supabase/server";
import { getDocumentById, linkDocumentToLoad } from "@/lib/repositories/documents";
import { createLoad } from "@/lib/repositories/loads";
import { mapRateConExtractionToLoadInput } from "@/lib/domain/ratecon-to-load-mapping";
import type { RateConExtraction, UUID } from "../../../types/domain";

export interface CreateLoadFromDocumentResult {
  loadId: UUID;
  shipperRateNeedsUserInput: true;
}

// Additive: creates a load from a document's completed OCR extraction and
// links the document to it. Does not touch the existing load-attached
// upload/OCR/review flow -- this only reads a document's already-recorded
// extraction (written by that existing flow) and calls the same
// createLoad() the load wizard uses.
export async function createLoadFromDocument(
  documentId: UUID
): Promise<CreateLoadFromDocumentResult> {
  const document = await getDocumentById(documentId);
  if (!document) {
    throw new Error("Document not found");
  }

  if (document.documentType !== "RateConfirmation_Signed") {
    throw new Error("Only a RateCon document can be used to create a load");
  }

  if (document.ocrStatus !== "completed" || !document.ocrExtractedJson) {
    throw new Error("Document OCR extraction is not complete yet");
  }

  const mapped = mapRateConExtractionToLoadInput(
    document.ocrExtractedJson as RateConExtraction
  );

  const load = await createLoad({
    customerId: mapped.customerId,
    carrierId: mapped.carrierId,
    origin: mapped.origin,
    destination: mapped.destination,
    pickupDate: mapped.pickupDate,
    deliveryDate: mapped.deliveryDate,
    carrierPay: mapped.carrierPay,
    // shipperRate has no equivalent in a RateCon; createLoad requires a
    // value, so 0 is passed here -- the same default the loads.shipper_rate
    // column itself uses -- rather than fabricating a figure.
    shipperRate: 0,
  });

  // createLoad()/CreateLoadInput (shared with the load wizard) has no
  // needs_shipper_rate field, so it's set here rather than widening that
  // shared type -- this marks shipper_rate = 0 as an explicit incomplete
  // state rather than a real $0 rate, scoped to just this new load.
  const supabase = await createClient();
  const { error: flagError } = await supabase
    .from("loads")
    .update({ needs_shipper_rate: true })
    .eq("id", load.id);

  if (flagError) {
    throw flagError;
  }

  await linkDocumentToLoad(documentId, load.id);

  return {
    loadId: load.id,
    shipperRateNeedsUserInput: true,
  };
}
