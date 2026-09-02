"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadLoadDocument } from "@/app/(dashboard)/loads/[id]/documents/actions";
import type { DocumentType, UUID } from "../../../types/domain";

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  POD: "Proof of delivery",
  BOL: "Bill of lading",
  RateConfirmation_Signed: "Rate confirmation (signed)",
  Carrier_Invoice: "Carrier invoice",
  Lumper_Receipt: "Lumper receipt",
  Scale_Ticket: "Scale ticket",
};

const DOCUMENT_TYPES = Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[];

export function DocumentUploadForm({ loadId }: { loadId: UUID }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("POD");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file to upload");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("documentType", documentType);

    setIsSubmitting(true);
    setError(null);
    try {
      await uploadLoadDocument(loadId, formData);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFileName(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="documentType">Document type</Label>
        <Select
          value={documentType}
          onValueChange={(value) => setDocumentType(value as DocumentType)}
        >
          <SelectTrigger id="documentType" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {DOCUMENT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="file">File</Label>
        <input
          ref={fileInputRef}
          id="file"
          type="file"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
          className="text-sm file:mr-2 file:h-8 file:rounded-lg file:border-0 file:bg-muted file:px-2.5 file:text-sm file:font-medium"
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Uploading..." : "Upload"}
      </Button>

      {fileName && !error && (
        <span className="text-sm text-muted-foreground">{fileName}</span>
      )}
      {error && <span className="text-sm text-destructive">{error}</span>}
    </form>
  );
}
