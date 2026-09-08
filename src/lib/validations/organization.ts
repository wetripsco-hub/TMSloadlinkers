import { z } from "zod";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const organizationSettingsSchema = z.object({
  name: z.string().trim().min(1, "Company name is required"),
  contactPersonName: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  contactEmail: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || EMAIL_PATTERN.test(v), "Enter a valid email"),
  contactPhone: z.string().trim().optional().or(z.literal("")),
  bankName: z.string().trim().optional().or(z.literal("")),
  routingNumber: z.string().trim().optional().or(z.literal("")),
  accountNumber: z.string().trim().optional().or(z.literal("")),
  remittanceNotes: z.string().trim().optional().or(z.literal("")),
  mcNumber: z.string().trim().optional().or(z.literal("")),
  dotNumber: z.string().trim().optional().or(z.literal("")),
});

export type OrganizationSettingsValues = z.infer<typeof organizationSettingsSchema>;
