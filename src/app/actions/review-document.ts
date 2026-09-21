"use server";

import { revalidatePath } from "next/cache";
import {
  getDocumentById,
  updateDocumentOcrExtractionIfUnchanged,
} from "@/lib/repositories/documents";
import type { OcrField, PodExtraction, RateConExtraction, UUID } from "../../../types/domain";

function isOcrField(value: unknown): value is OcrField<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    "confidence" in value &&
    typeof (value as OcrField<unknown>).confidence === "number"
  );
}

// The single write path for reviewed/approved OCR extractions -- called
// from both the load-level document list (OcrReviewPanel) and the
// review-queue page (ReviewPane), regardless of the document's current
// ocr_status. It merges only the keys the reviewer actually touched into
// the document's current ocr_extracted_json -- fetched fresh here, not
// trusted from the client -- so every untouched field (including any key
// the calling UI doesn't render) is carried through exactly as extracted.
// A reviewer-supplied value is a human correction, so it's written back at
// full confidence. There's no is_verified column on load_documents:
// ocr_status transitioning to 'completed' is itself the "reviewed and
// accepted" record, matching the schema as it exists.
//
// expectedUpdatedAt is the row's updated_at as the caller last read it
// (captured when its component mounted). The underlying write is guarded
// on that value, so a write that lands after someone else has already
// changed the row is rejected rather than merged or overwritten -- see
// DocumentConflictError.
export async function reviewDocument(
  documentId: UUID,
  correctedFields: Record<string, unknown>,
  expectedUpdatedAt: string
): Promise<void> {
  const document = await getDocumentById(documentId);
  if (!document) {
    throw new Error("Document not found");
  }

  const currentExtraction = (document.ocrExtractedJson ?? {}) as
    | RateConExtraction
    | PodExtraction
    | Record<string, unknown>;

  const mergedExtraction: Record<string, unknown> = { ...currentExtraction };
  for (const [key, value] of Object.entries(correctedFields)) {
    mergedExtraction[key] = { value, confidence: 100 };
  }

  const fields = Object.values(mergedExtraction).filter(isOcrField);
  const confidenceScore = fields.length
    ? Math.round(fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length)
    : null;

  await updateDocumentOcrExtractionIfUnchanged(
    documentId,
    "completed",
    confidenceScore,
    mergedExtraction,
    expectedUpdatedAt
  );

  revalidatePath("/documents/review");
  revalidatePath("/documents");
  if (document.loadId) {
    revalidatePath(`/loads/${document.loadId}/documents`);
    revalidatePath(`/loads/${document.loadId}`);
  }
}
