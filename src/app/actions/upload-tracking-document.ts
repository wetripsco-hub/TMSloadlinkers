"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_UPLOADS_PER_LOAD_PER_HOUR = 10;

export interface UploadTrackingDocumentResult {
  success: boolean;
  error: string | null;
  documentId: string | null;
}

// Mirrors the security model of advance_tracking_status
// (037_tracking_checkin.sql): the caller has only a tracking token, no
// auth.uid() at all, so identity is resolved server-side by
// resolve_load_for_tracking_upload (039_tracking_pod_upload.sql) -- the
// caller never supplies load_id/org_id directly, so it can never target
// another tenant's load. Once resolved, this uses the service-role client
// for the actual storage write and load_documents insert (same as every
// other privileged write in this codebase, e.g. the Stripe webhook)
// because there is no anon RLS policy on either storage.objects for this
// bucket or load_documents, and none is being added -- everything past
// token resolution runs with the same trust level as record_tracking_ping.
export async function uploadTrackingDocument(
  token: string,
  formData: FormData
): Promise<UploadTrackingDocumentResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "A file is required", documentId: null };
  }

  if (!file.type.startsWith("image/")) {
    return { success: false, error: "Only image files are supported", documentId: null };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { success: false, error: "File is too large (max 10MB)", documentId: null };
  }

  const supabase = await createClient();
  const { data: resolved, error: resolveError } = await supabase
    .rpc("resolve_load_for_tracking_upload", { p_token: token })
    .maybeSingle();

  if (resolveError) {
    throw resolveError;
  }
  if (!resolved?.load_id || !resolved?.org_id) {
    return { success: false, error: "Invalid tracking link", documentId: null };
  }

  const loadId = resolved.load_id;
  const orgId = resolved.org_id;

  const serviceClient = createServiceClient();

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await serviceClient
    .from("load_documents")
    .select("id", { count: "exact", head: true })
    .eq("load_id", loadId)
    .gte("created_at", oneHourAgo);

  if (countError) {
    throw countError;
  }
  if ((count ?? 0) >= MAX_UPLOADS_PER_LOAD_PER_HOUR) {
    return {
      success: false,
      error: "Too many uploads for this load in the last hour. Please try again later.",
      documentId: null,
    };
  }

  const objectPath = `${orgId}/${loadId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await serviceClient.storage
    .from("load-documents")
    .upload(objectPath, file, { contentType: file.type || undefined });

  if (uploadError) {
    return { success: false, error: "Failed to upload file", documentId: null };
  }

  const { data: document, error: insertError } = await serviceClient
    .from("load_documents")
    .insert({
      org_id: orgId,
      load_id: loadId,
      document_type: "POD",
      file_url: objectPath,
      ocr_status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !document) {
    return { success: false, error: "Failed to record uploaded document", documentId: null };
  }

  // Same fire-and-forget pattern as uploadLoadDocument
  // (app/(dashboard)/loads/[id]/documents/actions.ts): don't make the
  // driver wait on OCR, just make sure a failed invoke doesn't leave the
  // row stuck at 'pending' with no explanation.
  after(() => {
    serviceClient.functions
      .invoke("ocr-extract", { body: { documentId: document.id } })
      .catch(async (invokeError: unknown) => {
        const message = invokeError instanceof Error ? invokeError.message : String(invokeError);

        try {
          await serviceClient
            .from("load_documents")
            .update({ ocr_status: "failed", ocr_error: `Failed to trigger OCR: ${message}` })
            .eq("id", document.id);
        } catch {
          // Best-effort correction; swallow so this never becomes an
          // unhandled rejection on top of the invoke failure itself.
        }
      });
  });

  return { success: true, error: null, documentId: document.id };
}
