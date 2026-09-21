"use server";

import { revalidatePath } from "next/cache";

import {
  createCarrierVerificationProvider,
  normalizeCarrierIdentifier,
} from "@/lib/services/carrier-verification";
import { VERIFICATION_UNAVAILABLE_PREFIX } from "@/lib/domain/carrier-verification-status";
import {
  upsertCarrier,
  updateCarrierVerification,
  updateCarrierCompliance as updateCarrierComplianceRow,
  getCarrierById,
  type CarrierRecord,
} from "@/lib/repositories/carriers";
import { createClient } from "@/lib/supabase/server";
import {
  carrierOnboardSchema,
  carrierComplianceSchema,
  type CarrierOnboardValues,
  type CarrierComplianceValues,
} from "@/lib/validations/carrier";
import { parseCents } from "@/lib/money";
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

export async function onboardCarrier(
  values: CarrierOnboardValues,
  verification?: CarrierVerificationResult
): Promise<CarrierRecord> {
  const parsed = carrierOnboardSchema.parse(values);

  let carrier = await upsertCarrier({
    name: parsed.companyName,
    dotNumber: parsed.dotNumber || null,
    mcNumber: parsed.mcNumber || null,
    contactEmail: parsed.contactEmail || null,
    contactPhone: parsed.contactPhone || null,
  });

  // Persist the verification the dialog already fetched (via "Verify")
  // instead of discarding it once the dialog closes -- previously nothing
  // wrote previewCarrierVerification's result anywhere.
  if (verification) {
    carrier = await updateCarrierVerification(carrier.id, {
      authorityStatus: verification.authorityStatus,
      safetyRating: verification.safetyRating,
      outOfServiceDate: verification.outOfServiceDate,
      verificationSource: verification.source,
      verifiedAt: verification.fetchedAt,
    });
  }

  revalidatePath("/carriers");

  return carrier;
}

// "Verify Safety" (carrier-table.tsx) re-runs the FMCSA check for an
// existing carrier and persists the result -- previously it only called
// previewCarrierVerification and showed the result in a toast, with no
// verifyCarrier action to write it anywhere.
export async function verifyCarrier(
  carrierId: string,
  rawInput: { dotNumber?: string; mcNumber?: string }
): Promise<CarrierRecord> {
  const verification = await previewCarrierVerification(rawInput);

  const carrier = await updateCarrierVerification(carrierId, {
    authorityStatus: verification.authorityStatus,
    safetyRating: verification.safetyRating,
    outOfServiceDate: verification.outOfServiceDate,
    verificationSource: verification.source,
    verifiedAt: verification.fetchedAt,
  });

  revalidatePath("/carriers");

  return carrier;
}

const MAX_COI_BYTES = 10 * 1024 * 1024;
const ALLOWED_COI_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

function dollarStringToCents(value: string): number | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : parseCents(trimmed);
}

// Manually-entered compliance data (insurance, blacklist, COI) --
// separate from updateCarrierVerification/verifyCarrier's FMCSA-derived
// columns, and never called by either of those. carrierId's row is looked
// up first only to preserve its existing coi_file_url when no replacement
// file is uploaded (upsertCarrier-style "only touch what changed").
export async function updateCarrierCompliance(
  carrierId: string,
  values: CarrierComplianceValues,
  coiFile: File | null
): Promise<CarrierRecord> {
  const parsed = carrierComplianceSchema.parse(values);

  if (parsed.isBlacklisted && !parsed.blacklistReason) {
    throw new Error("A reason is required when blacklisting a carrier");
  }

  const existing = await getCarrierById(carrierId);
  if (!existing) {
    throw new Error("Carrier not found");
  }

  let coiFileUrl = existing.coiFileUrl;

  if (coiFile && coiFile.size > 0) {
    if (coiFile.size > MAX_COI_BYTES) {
      throw new Error("Certificate of insurance must be smaller than 10MB");
    }
    if (!ALLOWED_COI_TYPES.has(coiFile.type)) {
      throw new Error("Certificate of insurance must be a PDF, PNG, JPEG, or WebP file");
    }

    const supabase = await createClient();
    const objectPath = `${existing.orgId}/${carrierId}/${crypto.randomUUID()}-${coiFile.name}`;

    const { error: uploadError } = await supabase.storage
      .from("carrier-documents")
      .upload(objectPath, coiFile, {
        contentType: coiFile.type,
      });

    if (uploadError) {
      throw new Error(`Failed to upload certificate of insurance: ${uploadError.message}`);
    }

    // Stored as the raw object path, not a public URL -- carrier-documents
    // is a private bucket, so callers must sign it at read time (same
    // pattern as load_documents.file_url / documents/page.tsx).
    coiFileUrl = objectPath;
  }

  const carrier = await updateCarrierComplianceRow(carrierId, {
    insuranceCarrierName: parsed.insuranceCarrierName || null,
    insurancePolicyNumber: parsed.insurancePolicyNumber || null,
    insuranceExpiryDate: parsed.insuranceExpiryDate || null,
    cargoCoverageLimit: dollarStringToCents(parsed.cargoCoverageLimit ?? ""),
    autoLiabilityLimit: dollarStringToCents(parsed.autoLiabilityLimit ?? ""),
    isBlacklisted: parsed.isBlacklisted,
    blacklistReason: parsed.blacklistReason || null,
    coiFileUrl,
  });

  revalidatePath("/carriers");

  return carrier;
}
