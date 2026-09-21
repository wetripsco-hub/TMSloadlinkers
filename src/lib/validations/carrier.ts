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

// Manually-entered compliance data (049_carrier_compliance_columns.sql).
// Coverage limits are entered in whole dollars in the form and converted to
// Cents at the action boundary, matching how loads' dollar fields are
// handled -- kept as strings here since react-hook-form inputs are
// string-valued and an empty string must mean "not entered", not zero.
export const carrierComplianceSchema = z.object({
  insuranceCarrierName: z.string().trim().optional().or(z.literal("")),
  insurancePolicyNumber: z.string().trim().optional().or(z.literal("")),
  insuranceExpiryDate: z.string().trim().optional().or(z.literal("")),
  cargoCoverageLimit: z.string().trim().optional().or(z.literal("")),
  autoLiabilityLimit: z.string().trim().optional().or(z.literal("")),
  isBlacklisted: z.boolean(),
  blacklistReason: z.string().trim().optional().or(z.literal("")),
});

export type CarrierComplianceValues = z.infer<typeof carrierComplianceSchema>;
