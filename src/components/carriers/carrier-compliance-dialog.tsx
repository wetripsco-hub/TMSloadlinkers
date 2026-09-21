"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, ShieldAlert } from "lucide-react";

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
import {
  carrierComplianceSchema,
  type CarrierComplianceValues,
} from "@/lib/validations/carrier";
import { updateCarrierCompliance } from "@/app/(dashboard)/carriers/actions";
import type { CarrierRecord } from "@/lib/repositories/carriers";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function centsToInputValue(cents: number): string {
  return cents === 0 ? "" : (cents / 100).toFixed(2);
}

export function CarrierComplianceDialog({
  carrier,
  coiSignedUrl,
  trigger,
}: {
  carrier: CarrierRecord;
  coiSignedUrl: string | null;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [coiFile, setCoiFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultValues: CarrierComplianceValues = {
    insuranceCarrierName: carrier.insuranceCarrierName ?? "",
    insurancePolicyNumber: carrier.insurancePolicyNumber ?? "",
    insuranceExpiryDate: carrier.insuranceExpiryDate ?? "",
    cargoCoverageLimit: centsToInputValue(carrier.cargoCoverageLimit),
    autoLiabilityLimit: centsToInputValue(carrier.autoLiabilityLimit),
    isBlacklisted: carrier.isBlacklisted,
    blacklistReason: carrier.blacklistReason ?? "",
  };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CarrierComplianceValues>({
    resolver: zodResolver(carrierComplianceSchema),
    defaultValues,
  });

  const isBlacklisted = watch("isBlacklisted");

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      reset(defaultValues);
      setCoiFile(null);
      setSubmitError(null);
    }
  }

  async function onSubmit(values: CarrierComplianceValues) {
    setSubmitError(null);
    try {
      await updateCarrierCompliance(carrier.id, values, coiFile);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not save compliance data");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="border-slate-800 bg-[#18171d] text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">Compliance details</DialogTitle>
          <DialogDescription className="text-sm text-slate-400">
            Insurance, blacklist status, and certificate of insurance for {carrier.companyName}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="insuranceCarrierName" className="font-medium text-slate-200 text-xs">
                Insurance carrier
              </Label>
              <Input
                id="insuranceCarrierName"
                placeholder="e.g. Progressive"
                className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                {...register("insuranceCarrierName")}
              />
              <FieldError message={errors.insuranceCarrierName?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="insurancePolicyNumber" className="font-medium text-slate-200 text-xs">
                Policy number
              </Label>
              <Input
                id="insurancePolicyNumber"
                className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                {...register("insurancePolicyNumber")}
              />
              <FieldError message={errors.insurancePolicyNumber?.message} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="insuranceExpiryDate" className="font-medium text-slate-200 text-xs">
                Expiry date
              </Label>
              <Input
                id="insuranceExpiryDate"
                type="date"
                className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                {...register("insuranceExpiryDate")}
              />
              <FieldError message={errors.insuranceExpiryDate?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cargoCoverageLimit" className="font-medium text-slate-200 text-xs">
                Cargo limit ($)
              </Label>
              <Input
                id="cargoCoverageLimit"
                inputMode="decimal"
                placeholder="100000.00"
                className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                {...register("cargoCoverageLimit")}
              />
              <FieldError message={errors.cargoCoverageLimit?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="autoLiabilityLimit" className="font-medium text-slate-200 text-xs">
                Auto liability ($)
              </Label>
              <Input
                id="autoLiabilityLimit"
                inputMode="decimal"
                placeholder="1000000.00"
                className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                {...register("autoLiabilityLimit")}
              />
              <FieldError message={errors.autoLiabilityLimit?.message} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coiFile" className="font-medium text-slate-200 text-xs">
              Certificate of insurance
            </Label>
            {coiSignedUrl && !coiFile && (
              <a
                href={coiSignedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:underline"
              >
                <FileText className="h-3.5 w-3.5" />
                View current certificate
              </a>
            )}
            <Input
              id="coiFile"
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              className="bg-slate-900/80 border-slate-700 text-white file:text-white"
              onChange={(e) => setCoiFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-slate-500">
              {coiSignedUrl ? "Choose a file to replace the current certificate." : "PDF, PNG, JPEG, or WebP, up to 10MB."}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 rounded-xl border border-dashed border-rose-200 bg-rose-50/60 p-3.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-rose-900">
              <input type="checkbox" className="h-4 w-4" {...register("isBlacklisted")} />
              <ShieldAlert className="h-4 w-4" />
              Blacklist this carrier
            </label>
            {isBlacklisted && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="blacklistReason" className="text-xs font-medium text-rose-900">
                  Reason <span className="text-rose-500">*</span>
                </Label>
                <Input id="blacklistReason" {...register("blacklistReason")} />
                <FieldError message={errors.blacklistReason?.message} />
              </div>
            )}
          </div>

          {submitError && <FieldError message={submitError} />}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Saving..." : "Save compliance details"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
