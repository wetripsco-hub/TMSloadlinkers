"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createLoadDocument, updateDocumentOcrStatus } from "@/lib/repositories/documents";
import type {
  DocumentType,
  LoadDocument,
  OcrField,
  PodExtraction,
  RateConExtraction,
  UUID,
} from "../../../../../../types/domain";

const DOCUMENT_TYPES: DocumentType[] = [
  "POD",
  "BOL",
  "RateConfirmation_Signed",
  "Carrier_Invoice",
  "Lumper_Receipt",
  "Scale_Ticket",
];

const OCR_SUPPORTED_DOCUMENT_TYPES: DocumentType[] = ["RateConfirmation_Signed", "POD"];

// Tenant scoping is enforced twice here: the storage object path is prefixed
// with the caller's own org_id (checked by the load-documents bucket's RLS
// policies against profiles.org_id for auth.uid()), and createLoadDocument
// resolves org_id server-side the same way for the load_documents row. A
// caller can never write into another tenant's folder or row.
export async function uploadLoadDocument(
  loadId: UUID,
  formData: FormData
): Promise<LoadDocument> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("A file is required");
  }

  const documentType = formData.get("documentType");
  if (typeof documentType !== "string" || !DOCUMENT_TYPES.includes(documentType as DocumentType)) {
    throw new Error("A valid document type is required");
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
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("No profile found for the current user");
  }

  const objectPath = `${profile.org_id}/${loadId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("load-documents")
    .upload(objectPath, file, {
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw uploadError;
  }

  const document = await createLoadDocument({
    loadId,
    documentType: documentType as DocumentType,
    fileUrl: objectPath,
  });

  // Fire-and-forget: kick off OCR in the background so the upload
  // confirmation returns immediately instead of waiting on extraction.
  // Only supported document types are worth invoking the function for;
  // everything else is left exactly as it lands from createLoadDocument.
  if (OCR_SUPPORTED_DOCUMENT_TYPES.includes(document.documentType)) {
    // Wrapped in after() because a bare un-awaited promise here can get
    // frozen mid-flight once this function returns in a serverless
    // environment (Vercel) -- after() is guaranteed to run to completion
    // once the response has been sent, instead of racing termination.
    after(() => {
      supabase.functions
        .invoke("ocr-extract", { body: { documentId: document.id } })
        .catch(async (invokeError: unknown) => {
          // The function was never reached at all (network error, function
          // not found, etc.) -- not a failure the function itself recorded
          // on the row. Record it here so the document doesn't sit at
          // 'pending' forever with no explanation. Best-effort: never throw
          // out of a .catch handler.
          const message =
            invokeError instanceof Error ? invokeError.message : String(invokeError);

          try {
            await supabase
              .from("load_documents")
              .update({
                ocr_status: "failed",
                ocr_error: `Failed to trigger OCR: ${message}`,
              })
              .eq("id", document.id);
          } catch {
            // Best-effort correction; swallow so this never becomes an
            // unhandled rejection on top of the invoke failure itself.
          }
        });
    });
  }

  revalidatePath(`/loads/${loadId}/documents`);
  revalidatePath(`/loads/${loadId}`);

  return document;
}

function isOcrField(value: unknown): value is OcrField<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    "confidence" in value &&
    typeof (value as OcrField<unknown>).confidence === "number"
  );
}

// Approving persists the (possibly human-edited) extraction as the final
// record and marks OCR as completed — a reviewer confirming or correcting
// values is itself the verification step, so there is no separate
// unresolved-review state after this call.
export async function approveDocumentExtraction(
  documentId: UUID,
  loadId: UUID,
  extraction: RateConExtraction | PodExtraction | Record<string, unknown>
): Promise<LoadDocument> {
  const fields = Object.values(extraction).filter(isOcrField);
  const confidenceScore = fields.length
    ? Math.round(fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length)
    : null;

  const document = await updateDocumentOcrStatus(documentId, "completed", confidenceScore, extraction);

  revalidatePath(`/loads/${loadId}/documents`);
  revalidatePath(`/loads/${loadId}`);

  return document;
}
