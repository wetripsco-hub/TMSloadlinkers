"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatCents, parseCents } from "@/lib/money";
import { reviewDocument } from "@/app/actions/review-document";
import type { DocumentForReview } from "@/lib/repositories/documents";
import type { OcrField, PodExtraction, RateConExtraction } from "../../../types/domain";

type FieldKind = "text" | "money" | "number" | "boolean" | "datetime";

interface FieldConfig {
  key: string;
  label: string;
  kind: FieldKind;
}

// Mirrors components/documents/ocr-review-panel.tsx's field configs for the
// same two OCR-supported document types. Duplicated rather than imported --
// that component already duplicates its own isOcrField() independently from
// app/(dashboard)/loads/[id]/documents/actions.ts, so a third small copy
// here follows the same established precedent rather than introducing a new
// shared module for this task's scope.
const RATE_CON_FIELDS: FieldConfig[] = [
  { key: "brokerName", label: "Broker name", kind: "text" },
  { key: "brokerMcNumber", label: "Broker MC number", kind: "text" },
  { key: "agreedRate", label: "Agreed rate", kind: "money" },
  { key: "originCity", label: "Origin city", kind: "text" },
  { key: "originState", label: "Origin state", kind: "text" },
  { key: "destCity", label: "Destination city", kind: "text" },
  { key: "destState", label: "Destination state", kind: "text" },
  { key: "pickupWindowStart", label: "Pickup window start", kind: "datetime" },
  { key: "deliveryWindowStart", label: "Delivery window start", kind: "datetime" },
  { key: "equipmentType", label: "Equipment type", kind: "text" },
  { key: "commodity", label: "Commodity", kind: "text" },
  { key: "weightLbs", label: "Weight (lbs)", kind: "number" },
];

const POD_FIELDS: FieldConfig[] = [
  { key: "signatureDetected", label: "Signature detected", kind: "boolean" },
  { key: "deliveryDateTime", label: "Delivery date/time", kind: "datetime" },
  { key: "pieceCount", label: "Piece count", kind: "number" },
  { key: "sealNumber", label: "Seal number", kind: "text" },
  { key: "exceptionNoted", label: "Exception noted", kind: "boolean" },
  { key: "poNumber", label: "PO number", kind: "text" },
];

function fieldConfigsFor(documentType: string): FieldConfig[] | null {
  if (documentType === "RateConfirmation_Signed") return RATE_CON_FIELDS;
  if (documentType === "POD") return POD_FIELDS;
  return null;
}

function isOcrField(value: unknown): value is OcrField<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    "confidence" in value &&
    typeof (value as OcrField<unknown>).confidence === "number"
  );
}

function fieldValueToText(kind: FieldKind, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (kind === "money" && typeof value === "number") {
    return formatCents(value).replace(/[$,]/g, "");
  }
  return String(value);
}

function textToFieldValue(kind: FieldKind, text: string): unknown {
  const trimmed = text.trim();
  if (trimmed === "") return null;

  switch (kind) {
    case "money":
      try {
        return parseCents(trimmed);
      } catch {
        return null;
      }
    case "number": {
      const numeric = Number(trimmed.replace(/,/g, ""));
      return Number.isFinite(numeric) ? numeric : null;
    }
    default:
      return trimmed;
  }
}

// Fields below this confidence are flagged amber -- below the review UI's
// own bar, not the 80% used elsewhere in ocr-review-panel.tsx. This page's
// threshold is stricter by design: it's the queue for documents OCR itself
// already flagged as review_required.
const CONFIDENCE_THRESHOLD = 95;

export function ReviewPane({
  document,
  signedImageUrl,
}: {
  document: DocumentForReview;
  signedImageUrl: string | null;
}) {
  const router = useRouter();

  const originalFields = useMemo<Record<string, OcrField<unknown>>>(() => {
    const raw = (document.ocrExtractedJson ?? {}) as RateConExtraction | PodExtraction | Record<string, unknown>;
    const entries = Object.entries(raw).filter(([, value]) => isOcrField(value)) as [string, OcrField<unknown>][];
    return Object.fromEntries(entries);
  }, [document.ocrExtractedJson]);

  const [values, setValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(Object.entries(originalFields).map(([key, field]) => [key, field.value]))
  );
  const [editedKeys, setEditedKeys] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const configs = useMemo<FieldConfig[]>(() => {
    const known = fieldConfigsFor(document.documentType);
    if (known) return known;
    return Object.keys(originalFields).map((key) => ({ key, label: key, kind: "text" as const }));
  }, [document.documentType, originalFields]);

  function updateField(key: string, kind: FieldKind, text: string) {
    setValues((prev) => ({ ...prev, [key]: textToFieldValue(kind, text) }));
    setEditedKeys((prev) => new Set(prev).add(key));
  }

  function updateBooleanField(key: string, value: boolean | null) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setEditedKeys((prev) => new Set(prev).add(key));
  }

  async function handleAccept() {
    setIsSaving(true);
    setError(null);

    // Only fields the reviewer actually touched are sent -- reviewDocument
    // merges these into the document's current ocr_extracted_json
    // server-side rather than this component sending (and risking
    // overwriting with a stale copy of) every field.
    const correctedFields: Record<string, unknown> = {};
    for (const key of editedKeys) {
      correctedFields[key] = values[key];
    }

    try {
      await reviewDocument(document.id, correctedFields, document.updatedAt);
      setAccepted(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save review");
    } finally {
      setIsSaving(false);
    }
  }

  if (accepted) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
        Review accepted — OCR marked complete.
      </p>
    );
  }

  if (configs.length === 0) {
    return <p className="text-sm text-slate-500">No OCR data extracted for this document yet.</p>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Document image */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Document image</span>
        <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {signedImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signedImageUrl}
              alt="Uploaded document"
              className="max-h-[520px] w-full object-contain"
            />
          ) : (
            <span className="text-xs text-slate-400">Image unavailable</span>
          )}
        </div>
        {signedImageUrl && (
          <a
            href={signedImageUrl}
            target="_blank"
            rel="noreferrer"
            className="self-start text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Open full size
          </a>
        )}
      </div>

      {/* Extracted fields */}
      <div className="flex flex-col gap-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Extracted fields</span>

        <div className="grid gap-3 sm:grid-cols-2">
          {configs.map(({ key, label, kind }) => {
            const original = originalFields[key] ?? { value: null, confidence: 0 };
            const isEdited = editedKeys.has(key);
            const effectiveConfidence = isEdited ? 100 : original.confidence;
            const isLowConfidence = effectiveConfidence < CONFIDENCE_THRESHOLD;

            return (
              <div key={key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={`review-${document.id}-${key}`}
                    className={cn("text-xs font-medium", isLowConfidence ? "text-amber-700" : "text-slate-700")}
                  >
                    {label}
                  </label>
                  <span
                    className={cn(
                      "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      isLowConfidence
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    )}
                  >
                    {effectiveConfidence}%
                  </span>
                </div>

                {kind === "boolean" ? (
                  <select
                    id={`review-${document.id}-${key}`}
                    value={values[key] === true ? "true" : values[key] === false ? "false" : "unknown"}
                    onChange={(event) =>
                      updateBooleanField(key, event.target.value === "unknown" ? null : event.target.value === "true")
                    }
                    className={cn(
                      "h-9 rounded-lg border px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                      isLowConfidence ? "border-amber-300 bg-amber-50/50" : "border-slate-200 bg-white"
                    )}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                    <option value="unknown">Unknown</option>
                  </select>
                ) : (
                  <input
                    id={`review-${document.id}-${key}`}
                    type="text"
                    value={fieldValueToText(kind, values[key])}
                    onChange={(event) => updateField(key, kind, event.target.value)}
                    placeholder={kind === "money" ? "0.00" : undefined}
                    className={cn(
                      "h-9 rounded-lg border px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                      isLowConfidence ? "border-amber-300 bg-amber-50/50" : "border-slate-200 bg-white"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div>
          <button
            type="button"
            onClick={handleAccept}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}
