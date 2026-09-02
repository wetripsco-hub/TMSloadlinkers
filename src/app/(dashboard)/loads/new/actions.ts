"use server";

import { parseCents } from "@/lib/money";
import { createLoad } from "@/lib/repositories/loads";
import { loadWizardSchema, type LoadWizardValues } from "@/lib/validations/load";

function formatStop(stop: LoadWizardValues["origin"]): string {
  return `${stop.facilityName}, ${stop.address}, ${stop.city}, ${stop.state} ${stop.zip}`;
}

export async function createLoadFromWizard(values: LoadWizardValues) {
  const parsed = loadWizardSchema.parse(values);

  const load = await createLoad({
    customerId: parsed.customerId,
    carrierId: parsed.carrierId ? parsed.carrierId : null,
    origin: formatStop(parsed.origin),
    destination: formatStop(parsed.destination),
    pickupDate: parsed.origin.windowStart,
    deliveryDate: parsed.destination.windowStart,
    shipperRate: parseCents(parsed.shipperRate),
    carrierPay: parseCents(parsed.carrierPay),
  });

  return load;
}
