"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWorkspaceMode } from "@/hooks/use-workspace-mode";
import { parseCents } from "@/lib/money";
import { formatMoney } from "@/lib/format";
import { calculateBrokerMargin, calculateDispatcherCommission } from "@/lib/domain/margin";
import {
  loadWizardSchema,
  WIZARD_STEPS,
  LOAD_WIZARD_DEFAULT_VALUES,
  LOAD_WIZARD_DRAFT_STORAGE_KEY,
  type LoadWizardValues,
} from "@/lib/validations/load";
import { createLoadFromWizard } from "@/app/(dashboard)/loads/new/actions";

const DISPATCHER_COMMISSION_PERCENTAGE = 10;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function LiveEconomicsSummary({
  shipperRate,
  carrierPay,
}: {
  shipperRate: string;
  carrierPay: string;
}) {
  const { isDispatcher, isLoading } = useWorkspaceMode();

  let shipperCents: number | null = null;
  let carrierCents: number | null = null;

  try {
    shipperCents = shipperRate ? parseCents(shipperRate) : null;
    carrierCents = carrierPay ? parseCents(carrierPay) : null;
  } catch {
    shipperCents = null;
    carrierCents = null;
  }

  if (isLoading || shipperCents === null || carrierCents === null) {
    return null;
  }

  if (isDispatcher) {
    const commission = calculateDispatcherCommission(carrierCents, DISPATCHER_COMMISSION_PERCENTAGE);
    return (
      <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Estimated commission ({DISPATCHER_COMMISSION_PERCENTAGE}%): </span>
        <span className="font-medium">{formatMoney(commission)}</span>
      </div>
    );
  }

  const margin = calculateBrokerMargin(shipperCents, carrierCents);
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
      <span className="text-muted-foreground">Live margin: </span>
      <span className={margin < 0 ? "font-medium text-destructive" : "font-medium"}>
        {formatMoney(margin)}
      </span>
    </div>
  );
}

export function LoadWizard() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDraftRestored, setIsDraftRestored] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoadWizardValues>({
    resolver: zodResolver(loadWizardSchema),
    defaultValues: LOAD_WIZARD_DEFAULT_VALUES,
    mode: "onBlur",
  });

  useEffect(() => {
    const raw = window.localStorage.getItem(LOAD_WIZARD_DRAFT_STORAGE_KEY);
    if (raw) {
      try {
        reset(JSON.parse(raw) as LoadWizardValues);
      } catch {
        window.localStorage.removeItem(LOAD_WIZARD_DRAFT_STORAGE_KEY);
      }
    }
    setIsDraftRestored(true);
  }, [reset]);

  useEffect(() => {
    if (!isDraftRestored) return;
    const subscription = watch((values) => {
      window.localStorage.setItem(LOAD_WIZARD_DRAFT_STORAGE_KEY, JSON.stringify(values));
    });
    return () => subscription.unsubscribe();
  }, [watch, isDraftRestored]);

  const shipperRate = watch("shipperRate");
  const carrierPay = watch("carrierPay");

  const step = WIZARD_STEPS[stepIndex];
  const isLastStep = stepIndex === WIZARD_STEPS.length - 1;
  const isFirstStep = stepIndex === 0;

  async function goNext() {
    const valid = await trigger(step.fields as unknown as Path<LoadWizardValues>[]);
    if (valid) {
      setStepIndex((i) => Math.min(i + 1, WIZARD_STEPS.length - 1));
    }
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function onSubmit(values: LoadWizardValues) {
    setSubmitError(null);
    try {
      const load = await createLoadFromWizard(values);
      window.localStorage.removeItem(LOAD_WIZARD_DRAFT_STORAGE_KEY);
      router.push(`/loads/${load.id}`);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not create load");
    }
  }

  const values = watch();

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>New load</CardTitle>
        <CardDescription>
          Step {stepIndex + 1} of {WIZARD_STEPS.length}: {step.title}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-4">
          <LiveEconomicsSummary shipperRate={shipperRate} carrierPay={carrierPay} />

          {step.id === "customer-rate" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="customerId">
                  Customer <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="customerId"
                  placeholder="Customer ID"
                  aria-invalid={!!errors.customerId}
                  {...register("customerId")}
                />
                <FieldError message={errors.customerId?.message} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="carrierId">Carrier (optional)</Label>
                <Input
                  id="carrierId"
                  placeholder="Carrier ID"
                  aria-invalid={!!errors.carrierId}
                  {...register("carrierId")}
                />
                <FieldError message={errors.carrierId?.message} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="shipperRate">
                  Shipper rate ($) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="shipperRate"
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-invalid={!!errors.shipperRate}
                  {...register("shipperRate")}
                />
                <FieldError message={errors.shipperRate?.message} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="carrierPay">Carrier pay ($)</Label>
                <Input
                  id="carrierPay"
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-invalid={!!errors.carrierPay}
                  {...register("carrierPay")}
                />
                <FieldError message={errors.carrierPay?.message} />
              </div>
            </>
          )}

          {(step.id === "origin" || step.id === "destination") && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${step.id}.facilityName`}>
                  Facility name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id={`${step.id}.facilityName`}
                  aria-invalid={!!errors[step.id]?.facilityName}
                  {...register(`${step.id}.facilityName`)}
                />
                <FieldError message={errors[step.id]?.facilityName?.message} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${step.id}.address`}>
                  Address <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id={`${step.id}.address`}
                  aria-invalid={!!errors[step.id]?.address}
                  {...register(`${step.id}.address`)}
                />
                <FieldError message={errors[step.id]?.address?.message} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${step.id}.city`}>
                    City <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id={`${step.id}.city`}
                    aria-invalid={!!errors[step.id]?.city}
                    {...register(`${step.id}.city`)}
                  />
                  <FieldError message={errors[step.id]?.city?.message} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${step.id}.state`}>
                    State <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id={`${step.id}.state`}
                    maxLength={2}
                    aria-invalid={!!errors[step.id]?.state}
                    {...register(`${step.id}.state`)}
                  />
                  <FieldError message={errors[step.id]?.state?.message} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${step.id}.zip`}>
                    ZIP <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id={`${step.id}.zip`}
                    aria-invalid={!!errors[step.id]?.zip}
                    {...register(`${step.id}.zip`)}
                  />
                  <FieldError message={errors[step.id]?.zip?.message} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${step.id}.windowStart`}>
                  {step.id === "origin" ? "Pickup date" : "Delivery date"}{" "}
                  <span className="text-rose-500">*</span>
                </Label>
                <Controller
                  name={`${step.id}.windowStart`}
                  control={control}
                  render={({ field }) => (
                    <Input id={`${step.id}.windowStart`} type="date" {...field} />
                  )}
                />
                <FieldError message={errors[step.id]?.windowStart?.message} />
              </div>
            </>
          )}

          {step.id === "equipment-cargo" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="equipmentType">Equipment type</Label>
                <Input
                  id="equipmentType"
                  placeholder="Dry Van, Reefer, Flatbed..."
                  aria-invalid={!!errors.equipmentType}
                  {...register("equipmentType")}
                />
                <FieldError message={errors.equipmentType?.message} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="weightLbs">Weight (lbs)</Label>
                <Input
                  id="weightLbs"
                  inputMode="numeric"
                  aria-invalid={!!errors.weightLbs}
                  {...register("weightLbs")}
                />
                <FieldError message={errors.weightLbs?.message} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="commodity">Commodity</Label>
                <Input id="commodity" {...register("commodity")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="temperatureSetting">Temperature setting</Label>
                <Input id="temperatureSetting" {...register("temperatureSetting")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="specialInstructions">Special instructions</Label>
                <Input id="specialInstructions" {...register("specialInstructions")} />
              </div>
            </>
          )}

          {step.id === "review" && (
            <div className="flex flex-col gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Customer / Carrier</p>
                <p>{values.customerId} {values.carrierId ? `/ ${values.carrierId}` : ""}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Rates</p>
                <p>
                  Shipper {formatMoney(Number(values.shipperRate || 0) * 100)} · Carrier {formatMoney(Number(values.carrierPay || 0) * 100)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Origin</p>
                <p>
                  {values.origin.facilityName}, {values.origin.address}, {values.origin.city},{" "}
                  {values.origin.state} {values.origin.zip} ({values.origin.windowStart})
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Destination</p>
                <p>
                  {values.destination.facilityName}, {values.destination.address},{" "}
                  {values.destination.city}, {values.destination.state} {values.destination.zip} (
                  {values.destination.windowStart})
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Equipment & cargo</p>
                <p>
                  {values.equipmentType}
                  {values.weightLbs ? `, ${values.weightLbs} lbs` : ""}
                  {values.commodity ? `, ${values.commodity}` : ""}
                </p>
              </div>
              {submitError && <FieldError message={submitError} />}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={goBack} disabled={isFirstStep}>
            Back
          </Button>
          {isLastStep ? (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Load"}
            </Button>
          ) : (
            <Button type="button" onClick={goNext}>
              Next
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
