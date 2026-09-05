"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import { createOrganizationAction } from "./actions";

const workspaceTypes = ["freight_brokerage", "truck_dispatch", "hybrid_enterprise"] as const;

const workspaceTypeLabels: Record<(typeof workspaceTypes)[number], string> = {
  freight_brokerage: "Freight brokerage",
  truck_dispatch: "Truck dispatch",
  hybrid_enterprise: "Hybrid (brokerage + dispatch)",
};

const createOrgSchema = z.object({
  orgName: z.string().min(2, "Organization name is required"),
  workspaceType: z.enum(workspaceTypes, {
    errorMap: () => ({ message: "Select a workspace type" }),
  }),
});

type CreateOrgValues = z.infer<typeof createOrgSchema>;

export function CreateOrganizationForm() {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrgValues>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { workspaceType: "freight_brokerage" },
  });

  async function onSubmit(values: CreateOrgValues) {
    setFormError(null);
    const result = await createOrganizationAction(values);
    // A successful call redirects server-side and never returns here.
    if (result?.error) {
      setFormError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="orgName">Organization name</Label>
        <Input
          id="orgName"
          autoComplete="organization"
          aria-invalid={!!errors.orgName}
          {...register("orgName")}
        />
        {errors.orgName && (
          <p className="text-sm text-destructive">{errors.orgName.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="workspaceType">Workspace type</Label>
        <Controller
          name="workspaceType"
          control={control}
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger id="workspaceType" className="w-full">
                <SelectValue placeholder="Select a workspace type" />
              </SelectTrigger>
              <SelectContent>
                {workspaceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {workspaceTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.workspaceType && (
          <p className="text-sm text-destructive">{errors.workspaceType.message}</p>
        )}
      </div>
      {formError && <p className="text-sm text-destructive">{formError}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating company..." : "Create company"}
      </Button>
    </form>
  );
}
