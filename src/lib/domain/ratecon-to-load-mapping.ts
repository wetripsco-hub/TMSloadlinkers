import type { CreateLoadInput } from "@/lib/repositories/loads";
import type { RateConExtraction } from "../../../types/domain";

// CreateLoadInput.shipperRate is a required field (the load-creation table
// column defaults to 0, but the type doesn't allow omitting it), yet a
// RateCon only ever states what the carrier is paid -- never what the
// shipper is billed. Rather than fabricate a shipper rate, this mapping
// marks it as still needing user input; callers must not treat
// RateConToLoadInput.shipperRate as a real figure.
export type RateConToLoadInput = Omit<CreateLoadInput, "shipperRate"> & {
  shipperRate: null;
  shipperRateNeedsUserInput: true;
};

function fieldValue<T>(field: { value: T | null; confidence: number } | undefined): T | null {
  return field?.value ?? null;
}

function coarseLocation(city: string | null, state: string | null): string | null {
  if (!city && !state) return null;
  return [city, state].filter(Boolean).join(", ");
}

// Pure mapping: RateConExtraction (OCR output) -> the load-creation input
// shape consumed by createLoad() (src/lib/repositories/loads.ts), the same
// function the load wizard calls via createLoadFromWizard. Only fields the
// RateCon actually states are populated; nothing is fabricated for data a
// RateCon doesn't carry (facility name, street address, zip, shipper rate).
export function mapRateConExtractionToLoadInput(
  extraction: RateConExtraction
): RateConToLoadInput {
  return {
    customerId: null,
    carrierId: null,
    origin: coarseLocation(fieldValue(extraction.originCity), fieldValue(extraction.originState)),
    destination: coarseLocation(fieldValue(extraction.destCity), fieldValue(extraction.destState)),
    pickupDate: fieldValue(extraction.pickupWindowStart),
    deliveryDate: fieldValue(extraction.deliveryWindowStart),
    carrierPay: fieldValue(extraction.agreedRate) ?? 0,
    shipperRate: null,
    shipperRateNeedsUserInput: true,
  };
}
