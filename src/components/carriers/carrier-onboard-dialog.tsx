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
import { ComplianceStatusBadge } from "@/components/carriers/compliance-badge";
import { deriveComplianceBadge } from "@/lib/domain/carrier-compliance";
import {
  carrierOnboardSchema,
  CARRIER_ONBOARD_DEFAULT_VALUES,
  type CarrierOnboardValues,
} from "@/lib/validations/carrier";
import { onboardCarrier, previewCarrierVerification } from "@/app/(dashboard)/carriers/actions";
import type { Carrier, CarrierVerificationResult } from "../../../types/domain";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function previewCarrier(values: CarrierOnboardValues): Carrier {
  return {
    id: "",
    orgId: "",
    companyName: values.companyName,
    dotNumber: values.dotNumber ?? "",
    mcNumber: values.mcNumber ?? "",
    safetyRating: "unrated",
    authorityStatus: "unknown",
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
    lastVerifiedAt: null,
  };
}

export function CarrierOnboardDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [verification, setVerification] = useState<CarrierVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
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
      await onboardCarrier(values);
      setOpen(false);
      resetDialogState();
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not save carrier");
    }
  }

  const previewBadge = verification
    ? deriveComplianceBadge(previewCarrier(getValues()), verification)
    : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetDialogState();
      }}
    >
      <DialogTrigger render={<Button type="button">Add carrier</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Onboard carrier</DialogTitle>
          <DialogDescription>
            Enter a DOT or MC number and verify authority/safety before saving.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              aria-invalid={!!errors.companyName}
              {...register("companyName")}
            />
            <FieldError message={errors.companyName?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dotNumber">DOT number</Label>
              <Input id="dotNumber" aria-invalid={!!errors.dotNumber} {...register("dotNumber")} />
              <FieldError message={errors.dotNumber?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mcNumber">MC number</Label>
              <Input id="mcNumber" aria-invalid={!!errors.mcNumber} {...register("mcNumber")} />
              <FieldError message={errors.mcNumber?.message} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactEmail">Contact email</Label>
            <Input
              id="contactEmail"
              type="email"
              aria-invalid={!!errors.contactEmail}
              {...register("contactEmail")}
            />
            <FieldError message={errors.contactEmail?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactPhone">Contact phone</Label>
            <Input id="contactPhone" {...register("contactPhone")} />
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Verification preview</span>
              <Button type="button" variant="outline" size="sm" onClick={handleVerify} disabled={isVerifying}>
                {isVerifying ? "Verifying..." : "Verify"}
              </Button>
            </div>
            {verifyError && <FieldError message={verifyError} />}
            {verification && previewBadge && (
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <ComplianceStatusBadge badge={previewBadge} />
                </div>
                <span className="text-muted-foreground">
                  Authority: {verification.authorityActive ? "Active" : "Inactive"} · Safety rating:{" "}
                  {verification.safetyRating} · Insurance on file:{" "}
                  {verification.insuranceOnFile ? "Yes" : "No"}
                </span>
              </div>
            )}
          </div>

          {submitError && <FieldError message={submitError} />}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save carrier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
