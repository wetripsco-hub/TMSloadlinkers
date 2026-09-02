"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createLoadDocument } from "@/lib/repositories/documents";
import type { DocumentType, LoadDocument, UUID } from "../../../../../../types/domain";

const DOCUMENT_TYPES: DocumentType[] = [
  "POD",
  "BOL",
  "RateConfirmation_Signed",
  "Carrier_Invoice",
  "Lumper_Receipt",
  "Scale_Ticket",
];

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

  revalidatePath(`/loads/${loadId}/documents`);
  revalidatePath(`/loads/${loadId}`);

  return document;
}
