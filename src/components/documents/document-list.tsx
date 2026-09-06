"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { OcrReviewPanel } from "@/components/documents/ocr-review-panel";
import type { DocumentType, LoadDocument, OcrStatus } from "../../../types/domain";

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  POD: "Proof of delivery",
  BOL: "Bill of lading",
  RateConfirmation_Signed: "Rate confirmation (signed)",
  Carrier_Invoice: "Carrier invoice",
  Lumper_Receipt: "Lumper receipt",
  Scale_Ticket: "Scale ticket",
};

const OCR_STATUS_LABELS: Record<OcrStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
  review_required: "Review required",
};

const OCR_STATUS_COLORS: Record<OcrStatus, string> = {
  pending: "bg-slate-50 text-slate-700 border border-slate-200",
  processing: "bg-blue-50 text-blue-700 border border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  failed: "bg-rose-50 text-rose-700 border border-rose-200",
  review_required: "bg-amber-50 text-amber-700 border border-amber-200",
};

function OcrStatusBadge({ status }: { status: OcrStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold",
        OCR_STATUS_COLORS[status]
      )}
    >
      {OCR_STATUS_LABELS[status]}
    </span>
  );
}

export function DocumentList({ documents }: { documents: LoadDocument[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (documents.length === 0) {
    return <p className="text-sm text-slate-500">No documents uploaded yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {documents.map((document) => {
        const isSelected = document.id === selectedId;

        return (
          <div
            key={document.id}
            className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm hover:border-slate-300 transition-colors"
          >
            <button
              type="button"
              onClick={() => setSelectedId(isSelected ? null : document.id)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-900">
                  {DOCUMENT_TYPE_LABELS[document.documentType]}
                </span>
                <span className="text-xs text-slate-500">
                  Uploaded {new Date(document.uploadedAt).toLocaleString()}
                  {document.ocrConfidenceScore !== null
                    ? ` · ${document.ocrConfidenceScore}% confidence`
                    : ""}
                </span>
              </div>
              <OcrStatusBadge status={document.ocrStatus} />
            </button>

            {isSelected && (
              <div className="border-t border-slate-100 mt-3 pt-3">
                <OcrReviewPanel document={document} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
