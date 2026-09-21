"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import { uploadTrackingDocument } from "@/app/actions/upload-tracking-document";

type UploadStatus = "idle" | "uploading" | "success" | "error";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function PodUpload({
  token,
  onUploadSuccess,
}: {
  token: string;
  onUploadSuccess?: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  function handleSelectClick() {
    inputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setError("Only image files are supported");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setStatus("error");
      setError("File is too large (max 10MB)");
      return;
    }

    setStatus("uploading");
    setError(null);

    const formData = new FormData();
    formData.set("file", file);

    try {
      const result = await uploadTrackingDocument(token, formData);
      if (result.success) {
        setStatus("success");
        router.refresh();
        onUploadSuccess?.();
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setError(result.error ?? "Failed to upload photo");
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to upload photo");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handleSelectClick}
        disabled={status === "uploading"}
        className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.99] transition-all disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "uploading" ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <Camera className="h-5 w-5" />
            <span>Take or Upload POD Photo</span>
          </>
        )}
      </button>
      {status === "success" && (
        <p className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Photo uploaded!
        </p>
      )}
      {status === "error" && error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs font-medium text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
