"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import {
  facilityFormSchema,
  FACILITY_FORM_DEFAULT_VALUES,
  type FacilityFormValues,
} from "@/lib/validations/facility";
import { createFacilityAction, updateFacilityAction } from "@/app/(dashboard)/facilities/actions";
import type { CustomerRecord } from "@/lib/repositories/customers";
import type { Facility } from "../../../types/domain";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function facilityToFormValues(facility: Facility): FacilityFormValues {
  return {
    customerId: facility.customerId ?? "",
    name: facility.name,
    address: facility.address ?? "",
    city: facility.city,
    state: facility.state,
    zip: facility.zip ?? "",
    contactName: facility.contactName ?? "",
    contactPhone: facility.contactPhone ?? "",
    contactEmail: facility.contactEmail ?? "",
    appointmentRequired: facility.appointmentRequired,
    operatingHours: facility.operatingHours ?? "",
    notes: facility.notes ?? "",
  };
}

export interface FacilityFormDialogProps {
  customers: CustomerRecord[];
  // Presence of `facility` is what switches this between create and edit
  // mode -- one dialog, one schema, one submit path for both, rather than
  // two near-identical components.
  facility?: Facility;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function FacilityFormDialog({
  customers,
  facility,
  open: controlledOpen,
  onOpenChange,
  trigger,
  onSuccess,
}: FacilityFormDialogProps) {
  const router = useRouter();
  const isEditMode = Boolean(facility);

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof controlledOpen === "boolean";
  const open = isControlled ? controlledOpen : internalOpen;

  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FacilityFormValues>({
    resolver: zodResolver(facilityFormSchema),
    defaultValues: facility ? facilityToFormValues(facility) : FACILITY_FORM_DEFAULT_VALUES,
    mode: "onBlur",
  });

  // Editing a different row while a dialog instance is reused (e.g. one
  // dialog per table row that stays mounted) needs the form to pick up
  // that row's values -- reset() re-seeds both the fields and RHF's dirty/
  // touched tracking, which merely changing `defaultValues` would not.
  useEffect(() => {
    if (open) {
      reset(facility ? facilityToFormValues(facility) : FACILITY_FORM_DEFAULT_VALUES);
      Promise.resolve().then(() => setSubmitError(null));
    }
  }, [open, facility, reset]);

  const setOpen = (nextOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }
  };

  async function onSubmit(values: FacilityFormValues) {
    setSubmitError(null);
    try {
      if (isEditMode && facility) {
        await updateFacilityAction(facility.id, values);
      } else {
        await createFacilityAction(values);
      }
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not save facility");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger
          render={
            (trigger ?? (
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Facility
              </Button>
            )) as React.ReactElement
          }
        />
      )}
      <DialogContent className="border-slate-800 bg-[#18171d] text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">
            {isEditMode ? "Edit facility" : "Add facility"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-400">
            Save a shipping/receiving dock so it can be reused when creating loads.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="facilityName" className="flex items-center gap-1 font-medium text-slate-200 text-xs">
              Facility name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="facilityName"
              className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              placeholder="e.g. Acme Distribution Center 4"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="facilityCustomer" className="font-medium text-slate-200 text-xs">
              Customer
            </Label>
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  items={{
                    "": "No customer -- shared",
                    ...Object.fromEntries(customers.map((customer) => [customer.id, customer.name])),
                  }}
                >
                  <SelectTrigger id="facilityCustomer" className="w-full bg-slate-900/80 border-slate-700 text-white">
                    <SelectValue placeholder="No customer -- shared" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No customer -- shared</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <span className="text-[11px] text-slate-500">
              Leave as shared so every customer&apos;s loads can use this facility, or scope it to one customer&apos;s own dock.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="facilityAddress" className="font-medium text-slate-200 text-xs">
              Address
            </Label>
            <Input
              id="facilityAddress"
              className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              {...register("address")}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="facilityCity" className="flex items-center gap-1 font-medium text-slate-200 text-xs">
                City <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="facilityCity"
                className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                aria-invalid={!!errors.city}
                {...register("city")}
              />
              <FieldError message={errors.city?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="facilityState" className="flex items-center gap-1 font-medium text-slate-200 text-xs">
                State <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="facilityState"
                maxLength={2}
                className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                aria-invalid={!!errors.state}
                {...register("state")}
              />
              <FieldError message={errors.state?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="facilityZip" className="font-medium text-slate-200 text-xs">
                ZIP
              </Label>
              <Input
                id="facilityZip"
                className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                {...register("zip")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="facilityContactName" className="font-medium text-slate-200 text-xs">
                Contact name
              </Label>
              <Input
                id="facilityContactName"
                className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                {...register("contactName")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="facilityContactPhone" className="font-medium text-slate-200 text-xs">
                Contact phone
              </Label>
              <Input
                id="facilityContactPhone"
                className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                placeholder="(555) 000-0000"
                {...register("contactPhone")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="facilityContactEmail" className="font-medium text-slate-200 text-xs">
              Contact email
            </Label>
            <Input
              id="facilityContactEmail"
              type="email"
              className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              aria-invalid={!!errors.contactEmail}
              {...register("contactEmail")}
            />
            <FieldError message={errors.contactEmail?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="facilityOperatingHours" className="font-medium text-slate-200 text-xs">
              Operating hours
            </Label>
            <Input
              id="facilityOperatingHours"
              className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              placeholder="Mon-Fri 7am-4pm"
              {...register("operatingHours")}
            />
          </div>

          <label htmlFor="facilityAppointmentRequired" className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <input
              id="facilityAppointmentRequired"
              type="checkbox"
              className="h-4 w-4"
              {...register("appointmentRequired")}
            />
            Appointment required
          </label>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="facilityNotes" className="font-medium text-slate-200 text-xs">
              Notes
            </Label>
            <textarea
              id="facilityNotes"
              rows={2}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
              placeholder="Dock door 4, check in at security gate..."
              {...register("notes")}
            />
          </div>

          {submitError && <FieldError message={submitError} />}

          <DialogFooter>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Add Facility"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
