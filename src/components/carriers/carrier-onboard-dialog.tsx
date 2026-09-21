"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, AlertTriangle } from "lucide-react";
import { ComplianceStatusBadge } from "@/components/carriers/compliance-badge";
import { deriveComplianceBadge } from "@/lib/domain/carrier-compliance";
import {
  carrierOnboardSchema,
  CARRIER_ONBOARD_DEFAULT_VALUES,
  type CarrierOnboardValues,
} from "@/lib/validations/carrier";
import { onboardCarrier, previewCarrierVerification } from "@/app/(dashboard)/carriers/actions";
import { VERIFICATION_UNAVAILABLE_PREFIX } from "@/lib/domain/carrier-verification-status";
import type { Carrier, CarrierVerificationResult } from "../../../types/domain";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

// Mirrors what onboardCarrier will actually persist once "Onboard Carrier"
// is clicked (updateCarrierVerification runs with this same verification
// result), so the preview badge shown here matches the real post-save state
// instead of always reading the pre-verification "unknown"/never-verified
// fallback.
function previewCarrier(values: CarrierOnboardValues, verification: CarrierVerificationResult | null): Carrier {
  return {
    id: "",
    orgId: "",
    companyName: values.companyName,
    dotNumber: values.dotNumber ?? "",
    mcNumber: values.mcNumber ?? "",
    safetyRating: verification?.safetyRating ?? "unrated",
    authorityStatus: verification?.authorityStatus ?? "unknown",
    insuranceCarrierName: null,
    insurancePolicyNumber: null,
    insuranceExpiryDate: null,
    cargoCoverageLimit: 0,
    autoLiabilityLimit: 0,
    isBlacklisted: false,
    blacklistReason: null,
    isInternalFleet: false,
    dispatchFeePercentage: 0,
    dispatchFeeFlatWeekly: 0,
    lastVerifiedAt: verification?.fetchedAt ?? null,
  };
}

export interface CarrierOnboardDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CarrierOnboardDialog({
  open: controlledOpen,
  onOpenChange,
  trigger,
  onSuccess,
}: CarrierOnboardDialogProps = {}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof controlledOpen === "boolean";
  const open = isControlled ? controlledOpen : internalOpen;

  const [verification, setVerification] = useState<CarrierVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CarrierOnboardValues>({
    resolver: zodResolver(carrierOnboardSchema),
    defaultValues: CARRIER_ONBOARD_DEFAULT_VALUES,
    mode: "onBlur",
  });

  function resetDialogState() {
    reset(CARRIER_ONBOARD_DEFAULT_VALUES);
    setVerification(null);
    setVerifyError(null);
    setSubmitError(null);
  }

  const setOpen = (nextOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }
    if (!nextOpen) resetDialogState();
  };

  async function handleVerify() {
    const { dotNumber, mcNumber } = getValues();
    if (!dotNumber && !mcNumber) {
      setVerifyError("Enter a DOT or MC number to verify");
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);
    try {
      const result = await previewCarrierVerification({
        dotNumber: dotNumber || undefined,
        mcNumber: mcNumber || undefined,
      });
      setVerification(result);
      if (result.companyName && !getValues("companyName")) {
        setValue("companyName", result.companyName);
      }
    } catch (err) {
      setVerification(null);
      setVerifyError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  }

  async function onSubmit(values: CarrierOnboardValues) {
    setSubmitError(null);
    try {
      await onboardCarrier(values, verification ?? undefined);
      setOpen(false);
      resetDialogState();
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not save carrier");
    }
  }

  const previewBadge = verification
    ? deriveComplianceBadge(previewCarrier(getValues(), verification), verification)
    : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
      }}
    >
      {trigger !== null && (
        <DialogTrigger
          render={
            (trigger ?? (
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                + Onboard Carrier
              </Button>
            )) as React.ReactElement
          }
        />
      )}
      <DialogContent className="border-slate-800 bg-[#18171d] text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">Onboard carrier</DialogTitle>
          <DialogDescription className="text-sm text-slate-400">
            Enter a DOT or MC number and verify authority/safety before saving.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="companyName" className="flex items-center gap-1 font-medium text-slate-200 text-xs">
              Company name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="companyName"
              className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              placeholder="e.g. Eagle Express Logistics"
              aria-invalid={!!errors.companyName}
              {...register("companyName")}
            />
            <FieldError message={errors.companyName?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dotNumber" className="flex items-center gap-1 font-medium text-slate-200 text-xs">
                DOT number <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="dotNumber"
                className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                placeholder="e.g. 1234567"
                aria-invalid={!!errors.dotNumber}
                {...register("dotNumber")}
              />
              <FieldError message={errors.dotNumber?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mcNumber" className="flex items-center gap-1 font-medium text-slate-200 text-xs">
                MC number <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="mcNumber"
                className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                placeholder="e.g. 987654"
                aria-invalid={!!errors.mcNumber}
                {...register("mcNumber")}
              />
              <FieldError message={errors.mcNumber?.message} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactEmail" className="flex items-center gap-1 font-medium text-slate-200 text-xs">
              Contact email <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="contactEmail"
              type="email"
              className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              placeholder="dispatch@eagleexpress.com"
              aria-invalid={!!errors.contactEmail}
              {...register("contactEmail")}
            />
            <FieldError message={errors.contactEmail?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactPhone" className="font-medium text-slate-200 text-xs">
              Contact phone
            </Label>
            <Input
              id="contactPhone"
              className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              placeholder="(555) 000-0000"
              {...register("contactPhone")}
            />
          </div>

          {/* Verification Box with High-Contrast Verify Button */}
          <div className="flex flex-col gap-2.5 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Verification preview</span>
              <Button
                type="button"
                size="sm"
                onClick={handleVerify}
                disabled={isVerifying}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isVerifying ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify</span>
                )}
              </Button>
            </div>
            {verifyError && (
              verifyError.startsWith(VERIFICATION_UNAVAILABLE_PREFIX) ? (
                <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-sm text-amber-400">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{verifyError} Check the FMCSA API configuration and try again.</span>
                </div>
              ) : (
                <FieldError message={verifyError} />
              )
            )}
            {verification && previewBadge && (
              <div className="flex flex-col gap-1.5 text-sm pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">Status:</span>
                  <ComplianceStatusBadge badge={previewBadge} />
                </div>
                <span className="text-xs text-slate-400">
                  Authority: <strong className={verification.authorityActive ? "text-emerald-400" : "text-rose-400"}>{verification.authorityActive ? "Active" : "Inactive"}</strong> · Safety rating:{" "}
                  <strong className="text-slate-200">{verification.safetyRating}</strong> · Insurance on file:{" "}
                  <strong className={verification.insuranceOnFile ? "text-emerald-400" : "text-rose-400"}>{verification.insuranceOnFile ? "Yes" : "No"}</strong>
                </span>
              </div>
            )}
          </div>

          {submitError && <FieldError message={submitError} />}

          <DialogFooter>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Onboarding..." : "Onboard Carrier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
