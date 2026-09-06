"use server";

import { findLoadByCustomerPoNumber } from "@/lib/repositories/loads";
import { linkDocumentToLoad } from "@/lib/repositories/documents";
import type { UUID } from "../../../types/domain";

export interface MatchAndLinkPodResult {
  matched: boolean;
  loadId: string | null;
}

// Additive: bulk-POD auto-matching. A missing/blank poNumber (OCR found
// nothing, or the field wasn't on the document) is a normal, expected
// outcome here -- not an error -- so it resolves to no-match rather than
// throwing. An unmatched document is left exactly as-is (still unassigned)
// for manual resolution later.
export async function matchAndLinkPodToLoad(
  documentId: UUID,
  poNumber: string
): Promise<MatchAndLinkPodResult> {
  const trimmed = poNumber?.trim() ?? "";
  if (!trimmed) {
    return { matched: false, loadId: null };
  }

  const load = await findLoadByCustomerPoNumber(trimmed);
  if (!load) {
    return { matched: false, loadId: null };
  }

  await linkDocumentToLoad(documentId, load.id);

  return { matched: true, loadId: load.id };
}
