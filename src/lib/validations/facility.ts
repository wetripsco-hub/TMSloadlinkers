import { z } from "zod";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// customerId uses the literal "" sentinel for "No customer -- shared"
// (native <select>/shadcn Select values can't be null) -- converted to
// null at the action boundary, same convention as carrierId/customerId
// empty-string handling in lib/validations/load.ts.
export const facilityFormSchema = z.object({
  customerId: z.string(),
  name: z.string().trim().min(1, "Facility name is required"),
  address: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required"),
  state: z
    .string()
    .trim()
    .min(2, "2-letter state code")
    .max(2, "2-letter state code")
    .transform((v) => v.toUpperCase()),
  zip: z.string().trim().optional().or(z.literal("")),
  contactName: z.string().trim().optional().or(z.literal("")),
  contactPhone: z.string().trim().optional().or(z.literal("")),
  contactEmail: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || EMAIL_PATTERN.test(v), "Enter a valid email"),
  appointmentRequired: z.boolean(),
  operatingHours: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type FacilityFormValues = z.infer<typeof facilityFormSchema>;

export const FACILITY_FORM_DEFAULT_VALUES: FacilityFormValues = {
  customerId: "",
  name: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  appointmentRequired: false,
  operatingHours: "",
  notes: "",
};
