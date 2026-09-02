import type {
  Carrier,
  CarrierVerificationResult,
  Cents,
  ComplianceBadge,
} from "../../../types/domain";

const EXPIRING_WITHIN_DAYS = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function normalizeRating(rating: string): string {
  return rating.trim().toLowerCase();
}

function isUnsatisfactory(rating: string): boolean {
  return normalizeRating(rating) === "unsatisfactory";
}

function isSatisfactoryOrNone(rating: string): boolean {
  const normalized = normalizeRating(rating);
  return normalized === "satisfactory" || normalized === "none" || normalized === "";
}

function isInsuranceExpiringSoon(insuranceExpiryDate: string | null, now: Date): boolean {
  if (!insuranceExpiryDate) {
    return false;
  }

  const diffDays = (new Date(insuranceExpiryDate).getTime() - now.getTime()) / MS_PER_DAY;
  return diffDays <= EXPIRING_WITHIN_DAYS;
}

export interface DispatchEligibilityRequirements {
  minCargoCents: Cents;
  minAutoLiabilityCents: Cents;
}

export interface DispatchEligibilityResult {
  eligible: boolean;
  reasons: string[];
}

export function deriveComplianceBadge(
  carrier: Carrier,
  verificationResult: CarrierVerificationResult,
  now: Date = new Date()
): ComplianceBadge {
  if (
    carrier.isBlacklisted ||
    verificationResult.outOfServiceDate !== null ||
    isUnsatisfactory(verificationResult.safetyRating)
  ) {
    return "blocked";
  }

  if (isInsuranceExpiringSoon(carrier.insuranceExpiryDate, now)) {
    return "expiring";
  }

  const meetsMinimums =
    verificationResult.authorityActive &&
    verificationResult.insuranceOnFile &&
    isSatisfactoryOrNone(verificationResult.safetyRating);

  return meetsMinimums ? "verified" : "unverified";
}

export function isCarrierEligibleForDispatch(
  carrier: Carrier,
  verificationResult: CarrierVerificationResult,
  requirements: DispatchEligibilityRequirements,
  now: Date = new Date()
): DispatchEligibilityResult {
  const reasons: string[] = [];

  if (carrier.isBlacklisted) {
    reasons.push(
      carrier.blacklistReason
        ? `Carrier is blacklisted: ${carrier.blacklistReason}`
        : "Carrier is blacklisted"
    );
  }
  if (verificationResult.outOfServiceDate !== null) {
    reasons.push("Carrier is out of service");
  }
  if (isUnsatisfactory(verificationResult.safetyRating)) {
    reasons.push("Carrier has an unsatisfactory safety rating");
  }
  if (!verificationResult.authorityActive) {
    reasons.push("Carrier authority is not active");
  }
  if (!verificationResult.insuranceOnFile) {
    reasons.push("Carrier has no insurance on file");
  }
  if (carrier.cargoCoverageLimit < requirements.minCargoCents) {
    reasons.push("Cargo coverage is below the required minimum");
  }
  if (carrier.autoLiabilityLimit < requirements.minAutoLiabilityCents) {
    reasons.push("Auto liability coverage is below the required minimum");
  }
  if (isInsuranceExpiringSoon(carrier.insuranceExpiryDate, now)) {
    reasons.push("Carrier insurance is expiring within 30 days");
  }

  return { eligible: reasons.length === 0, reasons };
}
