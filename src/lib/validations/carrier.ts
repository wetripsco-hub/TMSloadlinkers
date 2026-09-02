import { z } from "zod";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const carrierOnboardSchema = z
  .object({
    companyName: z.string().trim().min(1, "Company name is required"),
    dotNumber: z.string().trim().optional().or(z.literal("")),
    mcNumber: z.string().trim().optional().or(z.literal("")),
    contactEmail: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || EMAIL_PATTERN.test(v), "Enter a valid email"),
    contactPhone: z.string().trim().optional().or(z.literal("")),
  })
  .refine((values) => !!values.dotNumber || !!values.mcNumber, {
    message: "Enter a DOT or MC number",
    path: ["dotNumber"],
  });

export type CarrierOnboardValues = z.infer<typeof carrierOnboardSchema>;

export const CARRIER_ONBOARD_DEFAULT_VALUES: CarrierOnboardValues = {
  companyName: "",
  dotNumber: "",
  mcNumber: "",
  contactEmail: "",
  contactPhone: "",
};
