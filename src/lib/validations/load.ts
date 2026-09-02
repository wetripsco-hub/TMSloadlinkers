import { z } from "zod";

export const loadStopSchema = z.object({
  facilityName: z.string().trim().min(1, "Facility name is required"),
  address: z.string().trim().min(1, "Address is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(2, "State is required").max(2, "Use a 2-letter state code"),
  zip: z.string().trim().min(5, "ZIP code is required"),
  windowStart: z.string().min(1, "Pickup/delivery date is required"),
});

export const customerRateStepSchema = z.object({
  customerId: z.string().trim().min(1, "Customer is required"),
  carrierId: z.string().trim().optional().or(z.literal("")),
  shipperRate: z
    .string()
    .trim()
    .min(1, "Shipper rate is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid dollar amount"),
  carrierPay: z
    .string()
    .trim()
    .min(1, "Carrier pay is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid dollar amount"),
});

export const equipmentCargoStepSchema = z.object({
  equipmentType: z.string().trim().min(1, "Equipment type is required"),
  weightLbs: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d+$/.test(v), "Enter a whole number of pounds"),
  commodity: z.string().trim().optional().or(z.literal("")),
  temperatureSetting: z.string().trim().optional().or(z.literal("")),
  specialInstructions: z.string().trim().optional().or(z.literal("")),
});

export const loadWizardSchema = z.object({
  ...customerRateStepSchema.shape,
  origin: loadStopSchema,
  destination: loadStopSchema,
  ...equipmentCargoStepSchema.shape,
});

export type LoadWizardValues = z.infer<typeof loadWizardSchema>;

export const WIZARD_STEPS = [
  {
    id: "customer-rate",
    title: "Customer & rate",
    fields: ["customerId", "carrierId", "shipperRate", "carrierPay"],
  },
  { id: "origin", title: "Origin", fields: ["origin"] },
  { id: "destination", title: "Destination", fields: ["destination"] },
  {
    id: "equipment-cargo",
    title: "Equipment & cargo",
    fields: ["equipmentType", "weightLbs", "commodity", "temperatureSetting", "specialInstructions"],
  },
  { id: "review", title: "Review", fields: [] },
] as const satisfies ReadonlyArray<{
  id: string;
  title: string;
  fields: ReadonlyArray<keyof LoadWizardValues>;
}>;

export const LOAD_WIZARD_DRAFT_STORAGE_KEY = "turvo:load-wizard-draft";

export const LOAD_WIZARD_DEFAULT_VALUES: LoadWizardValues = {
  customerId: "",
  carrierId: "",
  shipperRate: "",
  carrierPay: "",
  origin: {
    facilityName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    windowStart: "",
  },
  destination: {
    facilityName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    windowStart: "",
  },
  equipmentType: "",
  weightLbs: "",
  commodity: "",
  temperatureSetting: "",
  specialInstructions: "",
};
