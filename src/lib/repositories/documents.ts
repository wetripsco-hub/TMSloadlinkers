import { createClient } from "@/lib/supabase/server";
import type {
  DocumentType,
  LoadDocument,
  OcrStatus,
  RateConExtraction,
  PodExtraction,
  UUID,
} from "../../../types/domain";

// load_documents has no columns for thumbnail_url, is_verified, or
// verified_by_user_id yet — those Document domain fields are filled with
// safe, clearly-inert fallbacks below until the schema catches up.

interface LoadDocumentRow {
  id: string;
  org_id: string;
  load_id: string | null;
  document_type: DocumentType | null;
  file_url: string | null;
  ocr_status: OcrStatus;
  ocr_confidence_score: number | null;
  ocr_extracted_json: RateConExtraction | PodExtraction | Record<string, unknown> | null;
  created_at: string;
}

const DOCUMENT_COLUMNS =
  "id, org_id, load_id, document_type, file_url, ocr_status, ocr_confidence_score, ocr_extracted_json, created_at";

function mapRowToLoadDocument(row: LoadDocumentRow): LoadDocument {
  return {
    id: row.id,
    orgId: row.org_id,
    loadId: row.load_id,
    documentType: row.document_type ?? "BOL",
    fileUrl: row.file_url ?? "",
    thumbnailUrl: null,
    ocrStatus: row.ocr_status,
    ocrConfidenceScore: row.ocr_confidence_score,
    ocrExtractedJson: row.ocr_extracted_json,
    isVerified: false,
    verifiedByUserId: null,
    uploadedAt: row.created_at,
  };
}

export interface CreateLoadDocumentInput {
  loadId: UUID;
  documentType: DocumentType;
  fileUrl: string;
}

// All queries below rely on Postgres RLS (policies scoped to
// `profiles.org_id` for the calling user) for tenant isolation. org_id is
// never accepted as a parameter; on writes it is resolved server-side from
// the caller's own profile so a caller cannot target another tenant.
async function getCurrentOrgId(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<UUID> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    throw new Error("No profile found for the current user");
  }

  return data.org_id;
}

export async function listDocumentsByLoadId(loadId: UUID): Promise<LoadDocument[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("load_documents")
    .select(DOCUMENT_COLUMNS)
    .eq("load_id", loadId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as unknown as LoadDocumentRow[]).map(mapRowToLoadDocument);
}

export async function createLoadDocument(
  input: CreateLoadDocumentInput
): Promise<LoadDocument> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);

  const { data, error } = await supabase
    .from("load_documents")
    .insert({
      org_id: orgId,
      load_id: input.loadId,
      document_type: input.documentType,
      file_url: input.fileUrl,
      ocr_status: "pending",
    })
    .select(DOCUMENT_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToLoadDocument(data as unknown as LoadDocumentRow);
}

export async function updateDocumentOcrStatus(
  id: UUID,
  status: OcrStatus,
  confidence: number | null,
  extractedJson: RateConExtraction | PodExtraction | Record<string, unknown> | null
): Promise<LoadDocument> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("load_documents")
    .update({
      ocr_status: status,
      ocr_confidence_score: confidence,
      ocr_extracted_json: extractedJson,
    })
    .eq("id", id)
    .select(DOCUMENT_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToLoadDocument(data as unknown as LoadDocumentRow);
}
