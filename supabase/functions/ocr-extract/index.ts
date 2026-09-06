// supabase/functions/ocr-extract/index.ts
// Phase 4 / Task P4-T4
//
// POST { documentId } -> runs OCR extraction for one load_documents row
// and writes the result back onto it. Called after uploadLoadDocument
// (src/app/(dashboard)/loads/[id]/documents/actions.ts) inserts a row at
// ocr_status 'pending' -- that caller is not touched by this task, this
// function is only wired up to run standalone for now.
//
// Uses the service-role key so it can read/write any org's row and
// bypass check_and_increment_ocr_quota()'s "service role only" grant
// (019_ocr_rate_limiting.sql). Every exit past the initial 404 returns
// HTTP 200: a quota skip and an OCR failure are both business outcomes
// this function records on the row itself, not transport-level errors --
// the one invariant that must always hold is that a document never gets
// left stuck at 'processing'.

import { createClient } from "npm:@supabase/supabase-js@2";
import { getOcrProvider } from "./providers.ts";
import type { SupportedOcrDocumentType } from "./schemas.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  heic: "image/heic",
};

function inferMimeType(filePath: string): string {
  const extension = filePath.split(".").pop()?.toLowerCase() ?? "";
  return MIME_TYPES_BY_EXTENSION[extension] ?? "application/octet-stream";
}

function mapDocumentTypeToOcrType(documentType: string | null): SupportedOcrDocumentType | null {
  if (documentType === "RateConfirmation_Signed") return "RateConfirmation_Signed";
  if (documentType === "POD") return "POD";
  return null;
}

function truncateErrorMessage(message: string): string {
  return message.length > 500 ? `${message.slice(0, 500)}...` : message;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

interface OcrQuotaResult {
  allowed: boolean;
  used: number;
  limit: number | null;
}

Deno.serve(async (req: Request) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let documentId: unknown;
  try {
    const body = await req.json();
    documentId = (body as { documentId?: unknown })?.documentId;
  } catch {
    return jsonResponse({ error: true, message: "Request body must be JSON with a documentId field" }, 400);
  }

  if (typeof documentId !== "string" || documentId.length === 0) {
    return jsonResponse({ error: true, message: "documentId is required" }, 400);
  }

  // a. Fetch the row. Not found is a client error (bad id), not an OCR
  // failure -- there is no row here to mark 'failed', so this is the one
  // non-200 exit in the whole handler.
  const { data: document, error: fetchError } = await supabase
    .from("load_documents")
    .select("id, org_id, document_type, file_url, ocr_attempts")
    .eq("id", documentId)
    .maybeSingle();

  if (fetchError) {
    return jsonResponse({ error: true, message: fetchError.message }, 500);
  }
  if (!document) {
    return jsonResponse({ error: true, message: "Document not found" }, 404);
  }

  try {
    // b. Mark processing and record the attempt before doing any real work,
    // so a crash mid-extraction still shows a non-zero attempt count.
    const { error: markProcessingError } = await supabase
      .from("load_documents")
      .update({
        ocr_status: "processing",
        ocr_attempts: (document.ocr_attempts ?? 0) + 1,
      })
      .eq("id", document.id);

    if (markProcessingError) {
      throw new Error(`Failed to mark document as processing: ${markProcessingError.message}`);
    }

    // e. Resolve which schema this document type uses. Anything else
    // (BOL, Carrier_Invoice, Lumper_Receipt, Scale_Ticket) has no OCR
    // schema defined yet, so fail fast before the quota RPC even runs --
    // a type that was never going to succeed must not consume a unit of
    // the org's daily OCR quota.
    const ocrDocumentType = mapDocumentTypeToOcrType(document.document_type);
    if (!ocrDocumentType) {
      const { error: unsupportedError } = await supabase
        .from("load_documents")
        .update({ ocr_status: "failed", ocr_error: "Unsupported document type for OCR" })
        .eq("id", document.id);

      if (unsupportedError) {
        throw new Error(`Failed to record unsupported-type state: ${unsupportedError.message}`);
      }

      return jsonResponse({ error: true, message: "Unsupported document type for OCR" }, 200);
    }

    // c. Quota gate. check_and_increment_ocr_quota is atomic (row-locked
    // guarded UPDATE), so concurrent extractions for the same org can't
    // both slip through on the last unit of quota.
    const { data: quotaResult, error: quotaError } = await supabase.rpc(
      "check_and_increment_ocr_quota",
      { p_org_id: document.org_id }
    );

    if (quotaError) {
      throw new Error(`Quota check failed: ${quotaError.message}`);
    }

    const quota = quotaResult as OcrQuotaResult;

    if (!quota.allowed) {
      const { error: quotaExceededError } = await supabase
        .from("load_documents")
        .update({
          ocr_status: "review_required",
          ocr_error: "Daily OCR quota exceeded for your plan",
        })
        .eq("id", document.id);

      if (quotaExceededError) {
        throw new Error(`Failed to record quota-exceeded state: ${quotaExceededError.message}`);
      }

      // Expected business outcome, not a server error -- 200.
      return jsonResponse({ skipped: true, reason: "quota_exceeded" }, 200);
    }

    if (!document.file_url) {
      throw new Error("Document has no file_url to download");
    }

    // d. Download the file. file_url is the private bucket's object path
    // (org_id/load_id/uuid-filename), not a public URL -- only the
    // service-role client used here can read it directly.
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("load-documents")
      .download(document.file_url);

    if (downloadError || !fileBlob) {
      throw new Error(
        `Failed to download file from storage: ${downloadError?.message ?? "empty file"}`
      );
    }

    const imageBytes = new Uint8Array(await fileBlob.arrayBuffer());
    const mimeType = inferMimeType(document.file_url);

    // e. Run OCR.
    const provider = getOcrProvider();
    const { fields } = await provider.extract({
      imageBytes,
      mimeType,
      documentType: ocrDocumentType,
    });

    // f. Overall confidence is the weakest link, not an average -- one
    // low-confidence critical field (e.g. agreedRate) should route the
    // whole document to review even if every other field is a clean 99.
    const confidenceValues = Object.values(fields).map((f) => f.confidence);
    if (confidenceValues.length === 0) {
      throw new Error("OCR provider returned no fields");
    }
    const minConfidence = Math.min(...confidenceValues);
    const finalStatus: "completed" | "review_required" =
      minConfidence >= 95 ? "completed" : "review_required";

    // g. Persist. ocr_error is cleared so a later successful retry doesn't
    // leave a stale error message next to a completed result.
    const { error: writeError } = await supabase
      .from("load_documents")
      .update({
        ocr_extracted_json: fields,
        ocr_confidence_score: minConfidence,
        ocr_status: finalStatus,
        ocr_error: null,
      })
      .eq("id", document.id);

    if (writeError) {
      throw new Error(`Failed to write OCR result: ${writeError.message}`);
    }

    return jsonResponse(
      { documentId: document.id, ocrStatus: finalStatus, confidence: minConfidence },
      200
    );
  } catch (error) {
    // h. Whatever went wrong (quota RPC, download, Gemini call, malformed
    // response, write failure), the row must not be left at 'processing'
    // forever -- record the failure on the row and report it as a 200 so
    // callers don't retry-storm a transient 5xx into a stuck document.
    const message = truncateErrorMessage(error instanceof Error ? error.message : String(error));

    await supabase
      .from("load_documents")
      .update({ ocr_status: "failed", ocr_error: message })
      .eq("id", document.id);

    return jsonResponse({ error: true, message }, 200);
  }
});
