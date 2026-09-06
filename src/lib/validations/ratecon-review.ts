import { z } from "zod";

import { formatCents } from "@/lib/money";
import { mapRateConExtractionToLoadInput } from "@/lib/domain/ratecon-to-load-mapping";
import type { RateConExtraction } from "../../../types/domain";

const DOLLAR_PATTERN = /^\d+(\.\d{1,2})?$/;

export const rateconReviewSchema = z.object({
  origin: z.string().trim().min(1, "Origin is required"),
  destination: z.string().trim().min(1, "Destination is required"),
  equipmentType: z.string().trim().optional().or(z.literal("")),
  commodity: z.string().trim().optional().or(z.literal("")),
  weightLbs: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d+$/.test(v), "Enter a whole number of pounds"),
  pickupDate: z.string().trim().optional().or(z.literal("")),
  deliveryDate: z.string().trim().optional().or(z.literal("")),
  carrierPay: z
    .string()
    .trim()
    .min(1, "Carrier pay is required")
    .regex(DOLLAR_PATTERN, "Enter a valid dollar amount"),
  shipperRate: z
    .string()
    .trim()
    .min(1, "Shipper rate is required")
    .regex(DOLLAR_PATTERN, "Enter a valid dollar amount")
    .refine((v) => Number(v) > 0, "Shipper rate must be greater than $0.00"),
});

export type RateConReviewValues = z.infer<typeof rateconReviewSchema>;

function centsToDollarString(cents: number): string {
  return formatCents(cents).replace(/[$,]/g, "");
}

// Pre-fills the editable review form from an OCR extraction. carrierPay and
// the coarse origin/destination strings reuse the existing pure mapper;
// equipmentType/commodity/weightLbs (not part of that mapper's output,
// since CreateLoadInput didn't carry them before this schema widening) come
// straight from the raw extraction. shipperRate is intentionally left
// blank -- a RateCon never states it.
export function rateconReviewDefaultsFromExtraction(
  extraction: RateConExtraction
): RateConReviewValues {
  const mapped = mapRateConExtractionToLoadInput(extraction);

  return {
    origin: mapped.origin ?? "",
    destination: mapped.destination ?? "",
    equipmentType: extraction.equipmentType.value ?? "",
    commodity: extraction.commodity.value ?? "",
    weightLbs: extraction.weightLbs.value ? String(extraction.weightLbs.value) : "",
    pickupDate: mapped.pickupDate ?? "",
    deliveryDate: mapped.deliveryDate ?? "",
    carrierPay: centsToDollarString(mapped.carrierPay),
    shipperRate: "",
  };
}
