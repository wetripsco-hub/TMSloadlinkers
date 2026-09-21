import { FileText } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import type { TrackedDocument } from "@/lib/repositories/tracking";
import type { DocumentType, OcrStatus } from "../../../types/domain";

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

export function TrackingDocumentList({
  documents,
  isDark,
}: {
  documents: TrackedDocument[];
  isDark: boolean;
}) {
  if (documents.length === 0) {
    return (
      <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
        No documents uploaded yet for this shipment.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
            isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-slate-50/60"
          }`}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <FileText className="h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <p className={`truncate text-xs font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                {doc.documentType ? DOCUMENT_TYPE_LABELS[doc.documentType] : "Document"}
              </p>
              <p className="text-[11px] text-slate-500">{formatDateTime(doc.createdAt)}</p>
            </div>
          </div>
          <span
            className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold ${OCR_STATUS_COLORS[doc.ocrStatus]}`}
          >
            {OCR_STATUS_LABELS[doc.ocrStatus]}
          </span>
        </div>
      ))}
    </div>
  );
}
