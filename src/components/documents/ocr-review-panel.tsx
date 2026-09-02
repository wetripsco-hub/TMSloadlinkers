"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatCents, parseCents } from "@/lib/money";
import { approveDocumentExtraction } from "@/app/(dashboard)/loads/[id]/documents/actions";
import type {
  LoadDocument,
  OcrField,
  PodExtraction,
  RateConExtraction,
} from "../../../types/domain";

type FieldKind = "text" | "money" | "number" | "boolean" | "datetime";

interface FieldConfig {
  key: string;
  label: string;
  kind: FieldKind;
}

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

function fieldConfigsFor(document: LoadDocument): FieldConfig[] | null {
  if (document.documentType === "RateConfirmation_Signed") return RATE_CON_FIELDS;
  if (document.documentType === "POD") return POD_FIELDS;
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

function ConfidenceTag({ confidence }: { confidence: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        confidence >= 80
          ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
          : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
      )}
    >
      {confidence}%
    </span>
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

export function OcrReviewPanel({ document }: { document: LoadDocument }) {
  const router = useRouter();
  const fieldConfigs = fieldConfigsFor(document);

  const [extraction, setExtraction] = useState<Record<string, OcrField<unknown>>>(() => {
    const raw = (document.ocrExtractedJson ?? {}) as RateConExtraction | PodExtraction | Record<string, unknown>;
    const entries = Object.entries(raw).filter(([, value]) => isOcrField(value)) as [string, OcrField<unknown>][];
    return Object.fromEntries(entries);
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configs = useMemo<FieldConfig[]>(() => {
    if (fieldConfigs) return fieldConfigs;
    return Object.keys(extraction).map((key) => ({ key, label: key, kind: "text" as const }));
  }, [fieldConfigs, extraction]);

  function updateField(key: string, kind: FieldKind, text: string) {
    setExtraction((prev) => ({
      ...prev,
      [key]: { value: textToFieldValue(kind, text), confidence: 100 },
    }));
  }

  function updateBooleanField(key: string, value: boolean | null) {
    setExtraction((prev) => ({ ...prev, [key]: { value, confidence: 100 } }));
  }

  async function handleApprove() {
    if (!document.loadId) return;

    setIsSaving(true);
    setError(null);
    try {
      await approveDocumentExtraction(document.id, document.loadId, extraction);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save extraction");
    } finally {
      setIsSaving(false);
    }
  }

  if (Object.keys(extraction).length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No OCR data extracted for this document yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {configs.map(({ key, label, kind }) => {
          const currentField = extraction[key] ?? { value: null, confidence: 0 };

          return (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`ocr-${key}`}>{label}</Label>
                <ConfidenceTag confidence={currentField.confidence} />
              </div>

              {kind === "boolean" ? (
                <Select
                  value={
                    currentField.value === true
                      ? "true"
                      : currentField.value === false
                        ? "false"
                        : "unknown"
                  }
                  onValueChange={(value) =>
                    updateBooleanField(key, value === "unknown" ? null : value === "true")
                  }
                >
                  <SelectTrigger id={`ocr-${key}`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`ocr-${key}`}
                  value={fieldValueToText(kind, currentField.value)}
                  onChange={(event) => updateField(key, kind, event.target.value)}
                  placeholder={kind === "money" ? "0.00" : undefined}
                />
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div>
        <Button type="button" onClick={handleApprove} disabled={isSaving || !document.loadId}>
          {isSaving ? "Saving..." : "Approve & verify"}
        </Button>
      </div>
    </div>
  );
}
