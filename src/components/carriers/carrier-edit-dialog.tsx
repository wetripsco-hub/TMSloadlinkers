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
} from "@/components/ui/dialog";
import { carrierOnboardSchema, type CarrierOnboardValues } from "@/lib/validations/carrier";
import { updateCarrierAction } from "@/app/(dashboard)/carriers/actions";
import type { CarrierRecord } from "@/lib/repositories/carriers";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export interface CarrierEditDialogProps {
  carrier: CarrierRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CarrierEditDialog({ carrier, open, onOpenChange, onSuccess }: CarrierEditDialogProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CarrierOnboardValues>({
    resolver: zodResolver(carrierOnboardSchema),
    defaultValues: {
      companyName: carrier.companyName,
      dotNumber: carrier.dotNumber ?? "",
      mcNumber: carrier.mcNumber ?? "",
      contactEmail: carrier.contactEmail ?? "",
      contactPhone: carrier.contactPhone ?? "",
    },
  });

  async function onSubmit(values: CarrierOnboardValues) {
    setSubmitError(null);
    try {
      await updateCarrierAction(carrier.id, values);
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not save carrier");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-800 bg-[#18171d] text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">Edit carrier</DialogTitle>
          <DialogDescription className="text-sm text-slate-400">
            Correct any details that were entered wrong when this carrier was onboarded.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-companyName" className="flex items-center gap-1 font-medium text-slate-200 text-xs">
              Company name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="edit-companyName"
              className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              aria-invalid={!!errors.companyName}
              {...register("companyName")}
            />
            <FieldError message={errors.companyName?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-dotNumber" className="flex items-center gap-1 font-medium text-slate-200 text-xs">
                DOT number <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="edit-dotNumber"
                className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                aria-invalid={!!errors.dotNumber}
                {...register("dotNumber")}
              />
              <FieldError message={errors.dotNumber?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-mcNumber" className="flex items-center gap-1 font-medium text-slate-200 text-xs">
                MC number <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="edit-mcNumber"
                className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                aria-invalid={!!errors.mcNumber}
                {...register("mcNumber")}
              />
              <FieldError message={errors.mcNumber?.message} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-contactEmail" className="flex items-center gap-1 font-medium text-slate-200 text-xs">
              Contact email
            </Label>
            <Input
              id="edit-contactEmail"
              type="email"
              className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              aria-invalid={!!errors.contactEmail}
              {...register("contactEmail")}
            />
            <FieldError message={errors.contactEmail?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-contactPhone" className="font-medium text-slate-200 text-xs">
              Contact phone
            </Label>
            <Input
              id="edit-contactPhone"
              className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              {...register("contactPhone")}
            />
          </div>

          {submitError && <FieldError message={submitError} />}

          <DialogFooter>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CarrierEditDialog;
