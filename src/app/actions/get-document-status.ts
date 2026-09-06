"use server";

import { getDocumentById } from "@/lib/repositories/documents";
import type { LoadDocument, UUID } from "../../../types/domain";

// Additive: no polling/realtime mechanism exists anywhere in the document
// review flow today (confirmed by inspection), so this is the minimal
// client-callable read needed for a short-lived poll after an unassigned
// RateCon upload. Thin wrapper around the existing getDocumentById.
export async function getDocumentStatus(documentId: UUID): Promise<LoadDocument | null> {
  return getDocumentById(documentId);
}
