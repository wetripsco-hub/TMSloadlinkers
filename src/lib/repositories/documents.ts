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

  if (!error && data?.org_id) {
    return data.org_id;
  }

  const { ensureUserOrganization } = await import("@/lib/services/ensure-user-organization");
  const fallbackOrgId = await ensureUserOrganization(supabase);
  if (fallbackOrgId) {
    return fallbackOrgId;
  }

  throw new Error("No organization found for current user profile");
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

export async function listAllDocuments(
  pagination: { page: number; pageSize: number } = { page: 1, pageSize: 50 }
): Promise<{ data: LoadDocument[]; total: number }> {
  const supabase = await createClient();
  const { page, pageSize } = pagination;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("load_documents")
    .select(DOCUMENT_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  return {
    data: (data as unknown as LoadDocumentRow[]).map(mapRowToLoadDocument),
    total: count ?? 0,
  };
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
      ocr_extracted_json: extractedJson === null ? null : JSON.parse(JSON.stringify(extractedJson)),
    })
    .eq("id", id)
    .select(DOCUMENT_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToLoadDocument(data as unknown as LoadDocumentRow);
}
