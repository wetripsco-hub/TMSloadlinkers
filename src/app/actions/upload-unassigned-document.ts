"use server";

import { after } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createUnassignedLoadDocument } from "@/lib/repositories/documents";
import type { DocumentType, LoadDocument } from "../../../types/domain";

const DOCUMENT_TYPES: DocumentType[] = [
  "POD",
  "BOL",
  "RateConfirmation_Signed",
  "Carrier_Invoice",
  "Lumper_Receipt",
  "Scale_Ticket",
];

const OCR_SUPPORTED_DOCUMENT_TYPES: DocumentType[] = ["RateConfirmation_Signed", "POD"];

// Additive sibling of uploadLoadDocument (src/app/(dashboard)/loads/[id]/documents/actions.ts)
// for documents that don't belong to a load yet -- e.g. a RateCon uploaded
// before the load it describes exists. Stored under an "unassigned"
// placeholder path segment instead of a load_id: the load-documents
// bucket's RLS policies only check the org_id segment (see
// 008_load_documents_storage.sql), so this is just as tenant-isolated as
// the load-attached path. The existing load-attached upload flow is not
// modified by this file.
export async function uploadUnassignedLoadDocument(formData: FormData): Promise<LoadDocument> {
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

  const objectPath = `${profile.org_id}/unassigned/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("load-documents")
    .upload(objectPath, file, {
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw uploadError;
  }

  const document = await createUnassignedLoadDocument({
    documentType: documentType as DocumentType,
    fileUrl: objectPath,
  });

  if (OCR_SUPPORTED_DOCUMENT_TYPES.includes(document.documentType)) {
    after(() => {
      supabase.functions
        .invoke("ocr-extract", { body: { documentId: document.id } })
        .catch(async (invokeError: unknown) => {
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

  return document;
}
