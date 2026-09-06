"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, CheckCircle2, AlertTriangle, HelpCircle, Loader2 } from "lucide-react";

import { Modal } from "@/components/ui/tailadmin/modal";
import { TailAdminButton, TailAdminLabel } from "@/components/ui/tailadmin/form-elements";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadUnassignedLoadDocument } from "@/app/actions/upload-unassigned-document";
import { getDocumentStatus } from "@/app/actions/get-document-status";
import { matchAndLinkPodToLoad } from "@/app/actions/match-and-link-pod";
import type { PodExtraction, UUID } from "../../../types/domain";

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 20; // ~40s

type FileStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "matched"
  | "unmatched"
  | "failed";

interface PodFileState {
  key: string;
  file: File;
  status: FileStatus;
  documentId: UUID | null;
  loadId: UUID | null;
  errorMessage: string | null;
}

const STATUS_LABEL: Record<FileStatus, string> = {
  pending: "Pending",
  uploading: "Uploading",
  processing: "Processing OCR",
  matched: "Matched to load",
  unmatched: "Unmatched — needs manual link",
  failed: "Failed",
};

const STATUS_STYLE: Record<FileStatus, string> = {
  pending: "bg-slate-100 text-slate-600",
  uploading: "bg-blue-50 text-blue-700",
  processing: "bg-blue-50 text-blue-700",
  matched: "bg-emerald-50 text-emerald-700",
  unmatched: "bg-amber-50 text-amber-700",
  failed: "bg-rose-50 text-rose-700",
};

function StatusIcon({ status }: { status: FileStatus }) {
  if (status === "uploading" || status === "processing") {
    return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
  }
  if (status === "matched") return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === "unmatched") return <HelpCircle className="h-3.5 w-3.5" />;
  if (status === "failed") return <AlertTriangle className="h-3.5 w-3.5" />;
  return null;
}

function FileStatusBadge({ state }: { state: PodFileState }) {
  const label =
    state.status === "matched" && state.loadId
      ? `Matched to Load #${state.loadId.slice(0, 8).toUpperCase()}`
      : STATUS_LABEL[state.status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLE[state.status]
      )}
    >
      <StatusIcon status={state.status} />
      {label}
    </span>
  );
}

function fileKey(file: File, index: number): string {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

export interface BulkPodUploadModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  triggerLabel?: string;
}

export function BulkPodUploadModal({
  isOpen: controlledIsOpen,
  onOpenChange,
  trigger,
  triggerLabel = "Upload Document",
}: BulkPodUploadModalProps = {}) {
  const router = useRouter();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === "boolean";
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (nextOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(nextOpen);
    } else {
      setInternalIsOpen(nextOpen);
    }
  };

  const [files, setFiles] = useState<PodFileState[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateFile(key: string, patch: Partial<PodFileState>) {
    setFiles((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  }

  function handleFilesSelected() {
    const selected = fileInputRef.current?.files;
    if (!selected || selected.length === 0) return;

    const next: PodFileState[] = Array.from(selected).map((file, index) => ({
      key: fileKey(file, index),
      file,
      status: "pending",
      documentId: null,
      loadId: null,
      errorMessage: null,
    }));

    setFiles(next);
  }

  async function pollForOcrCompletion(documentId: UUID): Promise<PodExtraction | "failed" | "timeout"> {
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

      const document = await getDocumentStatus(documentId);
      if (document?.ocrStatus === "completed" && document.ocrExtractedJson) {
        return document.ocrExtractedJson as PodExtraction;
      }
      if (document?.ocrStatus === "failed") {
        return "failed";
      }
    }
    return "timeout";
  }

  // One file's full pipeline: upload -> poll -> match. Isolated try/catch
  // per file so one failure never blocks or fails the others.
  async function processFile(state: PodFileState) {
    try {
      updateFile(state.key, { status: "uploading" });

      const formData = new FormData();
      formData.set("file", state.file);
      formData.set("documentType", "POD");

      const document = await uploadUnassignedLoadDocument(formData);
      updateFile(state.key, { status: "processing", documentId: document.id });

      const extraction = await pollForOcrCompletion(document.id);

      if (extraction === "failed") {
        updateFile(state.key, { status: "failed", errorMessage: "OCR extraction failed for this document." });
        return;
      }
      if (extraction === "timeout") {
        updateFile(state.key, {
          status: "failed",
          errorMessage: "Processing timed out. Check this document later from the Documents page.",
        });
        return;
      }

      const poNumber = extraction.poNumber.value ?? "";
      const result = await matchAndLinkPodToLoad(document.id, poNumber);

      if (result.matched) {
        updateFile(state.key, { status: "matched", loadId: result.loadId });
      } else {
        updateFile(state.key, { status: "unmatched" });
      }
    } catch (err) {
      updateFile(state.key, {
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Upload failed",
      });
    }
  }

  async function handleUploadAll() {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      await Promise.all(files.map((f) => processFile(f)));
      router.refresh();
    } finally {
      setIsProcessing(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const hasSelection = files.length > 0;
  const allDone =
    hasSelection && files.every((f) => !["pending", "uploading", "processing"].includes(f.status));

  return (
    <>
      {trigger !== null && (
        trigger ?? (
          <Button
            type="button"
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
          >
            <UploadCloud className="h-4 w-4" />
            {triggerLabel}
          </Button>
        )
      )}

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Upload Freight Documents"
        description="Upload Rate Confirmations, Bills of Lading (BOL), or Proofs of Delivery (POD) for automated OCR extraction."
        maxWidth="2xl"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <TailAdminLabel htmlFor="pod-files">POD files</TailAdminLabel>
            <input
              ref={fileInputRef}
              id="pod-files"
              type="file"
              multiple
              accept="image/*,.pdf"
              disabled={isProcessing}
              onChange={handleFilesSelected}
              className="text-sm file:mr-2 file:h-8 file:rounded-lg file:border-0 file:bg-slate-100 file:px-2.5 file:text-sm file:font-medium disabled:opacity-50"
            />
          </div>

          {hasSelection && (
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/70 p-3">
              {files.map((state) => (
                <div
                  key={state.key}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-xs"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-slate-900">
                      {state.file.name}
                    </span>
                    {state.errorMessage && (
                      <span className="text-xs text-rose-600">{state.errorMessage}</span>
                    )}
                  </div>
                  <FileStatusBadge state={state} />
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <TailAdminButton type="button" variant="outline" size="md" onClick={handleClose}>
              {allDone ? "Close" : "Cancel"}
            </TailAdminButton>
            {!allDone && (
              <TailAdminButton
                type="button"
                variant="primary"
                size="md"
                loading={isProcessing}
                disabled={!hasSelection}
                onClick={handleUploadAll}
              >
                {isProcessing ? "Uploading..." : `Upload ${files.length || ""} POD${files.length === 1 ? "" : "s"}`}
              </TailAdminButton>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
