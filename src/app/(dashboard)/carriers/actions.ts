"use server";

import { revalidatePath } from "next/cache";

import { createCarrierVerificationProvider } from "@/lib/services/carrier-verification";
import { upsertCarrier, type CarrierRecord } from "@/lib/repositories/carriers";
import { carrierOnboardSchema, type CarrierOnboardValues } from "@/lib/validations/carrier";
import type { CarrierVerificationResult } from "../../../../types/domain";

export async function previewCarrierVerification(input: {
  dotNumber?: string;
  mcNumber?: string;
}): Promise<CarrierVerificationResult> {
  if (!input.dotNumber && !input.mcNumber) {
    throw new Error("Enter a DOT or MC number to verify");
  }

  const provider = createCarrierVerificationProvider();
  return provider.verify(input);
}

export async function onboardCarrier(values: CarrierOnboardValues): Promise<CarrierRecord> {
  const parsed = carrierOnboardSchema.parse(values);

  const carrier = await upsertCarrier({
    name: parsed.companyName,
    dotNumber: parsed.dotNumber || null,
    mcNumber: parsed.mcNumber || null,
    contactEmail: parsed.contactEmail || null,
    contactPhone: parsed.contactPhone || null,
  });

  revalidatePath("/carriers");

  return carrier;
}
