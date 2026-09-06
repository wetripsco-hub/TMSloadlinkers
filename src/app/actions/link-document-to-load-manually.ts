"use server";

import { revalidatePath } from "next/cache";
import { linkDocumentToLoad } from "@/lib/repositories/documents";
import type { LoadDocument, UUID } from "../../../types/domain";

// Additive "use server" wrapper: linkDocumentToLoad (src/lib/repositories/documents.ts)
// is a plain repository function backed by the server-only Supabase client,
// not a Server Action itself -- same reason completeShipperRateAction wraps
// completeShipperRate. Used by the manual-link control on the global
// Documents page for documents an auto-match (RateCon/POD) left unassigned.
export async function linkDocumentToLoadManually(
  documentId: UUID,
  loadId: UUID
): Promise<LoadDocument> {
  const document = await linkDocumentToLoad(documentId, loadId);
  revalidatePath("/documents");
  revalidatePath(`/loads/${loadId}`);
  return document;
}
