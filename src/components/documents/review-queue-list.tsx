"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { ReviewPane } from "@/components/documents/review-pane";
import type { DocumentForReview } from "@/lib/repositories/documents";
import type { DocumentType } from "../../../types/domain";

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  POD: "Proof of delivery",
  BOL: "Bill of lading",
  RateConfirmation_Signed: "Rate confirmation (signed)",
  Carrier_Invoice: "Carrier invoice",
  Lumper_Receipt: "Lumper receipt",
  Scale_Ticket: "Scale ticket",
};

// Same click-to-expand-inline pattern as components/documents/document-list.tsx
// (row -> inline panel), reused here for consistency rather than introducing
// a modal/drawer pattern that doesn't exist elsewhere in the documents
// feature.
export function ReviewQueueList({
  documents,
  signedUrlByPath,
}: {
  documents: DocumentForReview[];
  signedUrlByPath: Record<string, string>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {documents.map((document) => {
        const isSelected = document.id === selectedId;

        return (
          <div
            key={document.id}
            className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition-colors hover:border-slate-300"
          >
            <button
              type="button"
              onClick={() => setSelectedId(isSelected ? null : document.id)}
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-900">
                  {DOCUMENT_TYPE_LABELS[document.documentType] ?? document.documentType}
                </span>
                <span className="text-xs text-slate-500">
                  {document.loadNumber ? `Load ${document.loadNumber}` : "Unlinked"} · Uploaded{" "}
                  {formatDate(document.uploadedAt)}
                </span>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
                  document.ocrConfidenceScore !== null && document.ocrConfidenceScore < 95
                    ? "border border-amber-200 bg-amber-50 text-amber-700"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                )}
              >
                {document.ocrConfidenceScore !== null ? `${document.ocrConfidenceScore}% confidence` : "No score"}
              </span>
            </button>

            {isSelected && (
              <div className="border-t border-slate-100 p-4">
                <ReviewPane document={document} signedImageUrl={signedUrlByPath[document.fileUrl] ?? null} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
