"use server";

import { revalidatePath } from "next/cache";

import {
  createCarrierVerificationProvider,
  normalizeCarrierIdentifier,
} from "@/lib/services/carrier-verification";
import { VERIFICATION_UNAVAILABLE_PREFIX } from "@/lib/domain/carrier-verification-status";
import { upsertCarrier, type CarrierRecord } from "@/lib/repositories/carriers";
import { carrierOnboardSchema, type CarrierOnboardValues } from "@/lib/validations/carrier";
import type { CarrierVerificationResult } from "../../../../types/domain";

export async function previewCarrierVerification(rawInput: {
  dotNumber?: string;
  mcNumber?: string;
}): Promise<CarrierVerificationResult> {
  // rawInput comes straight from the dialog's react-hook-form getValues(),
  // which isn't trimmed/validated the way a submitted form value would be --
  // normalize here, at the trust boundary, so neither the cache key nor the
  // outgoing FMCSA request ever sees stray whitespace.
  const input = {
    dotNumber: normalizeCarrierIdentifier(rawInput.dotNumber),
    mcNumber: normalizeCarrierIdentifier(rawInput.mcNumber),
  };

  if (!input.dotNumber && !input.mcNumber) {
    throw new Error("Enter a DOT or MC number to verify");
  }

  // createCarrierVerificationProvider() falls back to MockCarrierVerificationProvider
  // when no key is configured -- that's fine for tests that construct it directly,
  // but here it would silently hand back a plausible-looking fake result (e.g.
  // authorityActive: false) that's indistinguishable from a real "checked and
  // blocked" carrier. Refuse explicitly instead.
  if (!process.env.FMCSA_WEB_KEY) {
    throw new Error(
      `${VERIFICATION_UNAVAILABLE_PREFIX}: no FMCSA API key is configured, so no carrier check was performed.`
    );
  }

  const provider = createCarrierVerificationProvider();
  try {
    return await provider.verify(input);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "the FMCSA lookup failed";
    throw new Error(`${VERIFICATION_UNAVAILABLE_PREFIX}: ${detail}`);
  }
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
