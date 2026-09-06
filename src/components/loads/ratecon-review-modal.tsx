"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UploadCloud, AlertTriangle } from "lucide-react";

import {
  TailAdminInput,
  TailAdminLabel,
  TailAdminButton,
} from "@/components/ui/tailadmin/form-elements";
import { uploadUnassignedLoadDocument } from "@/app/actions/upload-unassigned-document";
import { getDocumentStatus } from "@/app/actions/get-document-status";
import { createLoadFromRateConReview } from "@/app/actions/create-load-from-ratecon-review";
import {
  rateconReviewSchema,
  rateconReviewDefaultsFromExtraction,
  type RateConReviewValues,
} from "@/lib/validations/ratecon-review";
import type { RateConExtraction, UUID } from "../../../types/domain";

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 20; // ~40s

type Step = "pick" | "processing" | "review";

export function RateConReviewModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("pick");
  const [documentId, setDocumentId] = useState<UUID | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [processingError, setProcessingError] = useState<string | null>(null);
  const pollAttemptsRef = useRef(0);

  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<RateConReviewValues>({
    resolver: zodResolver(rateconReviewSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (step !== "processing" || !documentId) return;

    pollAttemptsRef.current = 0;

    const interval = setInterval(async () => {
      pollAttemptsRef.current += 1;

      try {
        const document = await getDocumentStatus(documentId);

        if (document?.ocrStatus === "completed" && document.ocrExtractedJson) {
          clearInterval(interval);
          reset(
            rateconReviewDefaultsFromExtraction(document.ocrExtractedJson as RateConExtraction)
          );
          setStep("review");
          return;
        }

        if (document?.ocrStatus === "failed") {
          clearInterval(interval);
          setProcessingError("OCR extraction failed for this document. Try uploading it again.");
          return;
        }
      } catch (err) {
        clearInterval(interval);
        setProcessingError(err instanceof Error ? err.message : "Could not check processing status");
        return;
      }

      if (pollAttemptsRef.current >= POLL_MAX_ATTEMPTS) {
        clearInterval(interval);
        setProcessingError(
          "Processing is taking longer than expected. Try again, or check this document later from the load's Documents page."
        );
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [step, documentId, reset]);

  async function handleUpload() {
    setUploadError(null);
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadError("Choose a file to upload");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("documentType", "RateConfirmation_Signed");

    setIsUploading(true);
    try {
      const document = await uploadUnassignedLoadDocument(formData);
      setDocumentId(document.id);
      setProcessingError(null);
      setStep("processing");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  function retryFromScratch() {
    setDocumentId(null);
    setProcessingError(null);
    setUploadError(null);
    setCreateError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStep("pick");
  }

  async function onSubmit(values: RateConReviewValues) {
    if (!documentId) return;
    setCreateError(null);
    setIsCreating(true);

    try {
      const { loadId } = await createLoadFromRateConReview(documentId, values);
      onClose();
      router.push(`/loads/${loadId}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create load");
      setIsCreating(false);
    }
  }

  if (step === "pick") {
    return (
      <div className="flex flex-col gap-4">
        {uploadError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
            {uploadError}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <TailAdminLabel htmlFor="ratecon-file">RateCon file</TailAdminLabel>
          <input
            ref={fileInputRef}
            id="ratecon-file"
            type="file"
            accept="application/pdf,image/*"
            disabled={isUploading}
            className="text-sm file:mr-2 file:h-8 file:rounded-lg file:border-0 file:bg-slate-100 file:px-2.5 file:text-sm file:font-medium disabled:opacity-50"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <TailAdminButton type="button" variant="outline" size="md" onClick={onClose}>
            Cancel
          </TailAdminButton>
          <TailAdminButton
            type="button"
            variant="primary"
            size="md"
            loading={isUploading}
            startIcon={<UploadCloud className="h-4 w-4" />}
            onClick={handleUpload}
          >
            {isUploading ? "Uploading..." : "Upload & Extract"}
          </TailAdminButton>
        </div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        {processingError ? (
          <>
            <AlertTriangle className="h-8 w-8 text-rose-500" />
            <p className="text-sm font-medium text-rose-700">{processingError}</p>
            <div className="flex gap-3">
              <TailAdminButton type="button" variant="outline" size="md" onClick={onClose}>
                Close
              </TailAdminButton>
              <TailAdminButton type="button" variant="primary" size="md" onClick={retryFromScratch}>
                Try again
              </TailAdminButton>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-slate-600">Processing document...</p>
            <p className="text-xs text-slate-400">
              Extracting rate, route, and load details. This usually takes a few seconds.
            </p>
          </>
        )}
      </div>
    );
  }

  // step === "review"
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {createError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
          {createError}
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-700">
          Confirm load details
        </h4>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <TailAdminLabel htmlFor="origin" required>Origin</TailAdminLabel>
            <TailAdminInput id="origin" error={errors.origin?.message} {...register("origin")} />
          </div>
          <div>
            <TailAdminLabel htmlFor="destination" required>Destination</TailAdminLabel>
            <TailAdminInput
              id="destination"
              error={errors.destination?.message}
              {...register("destination")}
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <TailAdminLabel htmlFor="pickupDate">Pickup</TailAdminLabel>
            <TailAdminInput id="pickupDate" {...register("pickupDate")} />
          </div>
          <div>
            <TailAdminLabel htmlFor="deliveryDate">Delivery</TailAdminLabel>
            <TailAdminInput id="deliveryDate" {...register("deliveryDate")} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <TailAdminLabel htmlFor="equipmentType">Equipment</TailAdminLabel>
            <TailAdminInput id="equipmentType" {...register("equipmentType")} />
          </div>
          <div>
            <TailAdminLabel htmlFor="commodity">Commodity</TailAdminLabel>
            <TailAdminInput id="commodity" {...register("commodity")} />
          </div>
          <div>
            <TailAdminLabel htmlFor="weightLbs">Weight (lbs)</TailAdminLabel>
            <TailAdminInput
              id="weightLbs"
              inputMode="numeric"
              error={errors.weightLbs?.message}
              {...register("weightLbs")}
            />
          </div>
        </div>

        <div className="mt-3">
          <TailAdminLabel htmlFor="carrierPay" required>Carrier Pay ($)</TailAdminLabel>
          <TailAdminInput
            id="carrierPay"
            inputMode="decimal"
            startIcon={<span className="text-sm font-bold">$</span>}
            error={errors.carrierPay?.message}
            {...register("carrierPay")}
          />
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <TailAdminLabel htmlFor="shipperRate" required>
          Shipper Rate ($)
        </TailAdminLabel>
        <p className="mb-2 text-xs text-amber-700">
          This field isn&apos;t on a RateCon — enter what the customer is being billed.
        </p>
        <TailAdminInput
          id="shipperRate"
          inputMode="decimal"
          placeholder="e.g. 2850.00"
          startIcon={<span className="text-sm font-bold">$</span>}
          error={errors.shipperRate?.message}
          {...register("shipperRate")}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <TailAdminButton type="button" variant="outline" size="md" onClick={onClose}>
          Cancel
        </TailAdminButton>
        <TailAdminButton
          type="submit"
          variant="primary"
          size="md"
          loading={isCreating}
          disabled={!isValid}
        >
          Create Load
        </TailAdminButton>
      </div>
    </form>
  );
}
