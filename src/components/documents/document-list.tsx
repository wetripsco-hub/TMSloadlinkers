"use client";

import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
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
  pending: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  review_required: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
};

function OcrStatusBadge({ status }: { status: OcrStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
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
    return <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {documents.map((document) => {
        const isSelected = document.id === selectedId;

        return (
          <Card key={document.id}>
            <CardContent className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setSelectedId(isSelected ? null : document.id)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {DOCUMENT_TYPE_LABELS[document.documentType]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Uploaded {new Date(document.uploadedAt).toLocaleString()}
                    {document.ocrConfidenceScore !== null
                      ? ` · ${document.ocrConfidenceScore}% confidence`
                      : ""}
                  </span>
                </div>
                <OcrStatusBadge status={document.ocrStatus} />
              </button>

              {isSelected && (
                <div className="border-t pt-3">
                  <OcrReviewPanel document={document} />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
