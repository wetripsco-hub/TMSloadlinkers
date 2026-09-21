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

// Expiring soon = still current but within the window (0-30 days out
// inclusive). A lapsed policy is a distinct, stronger signal --
// isInsuranceExpired, below -- so this deliberately excludes negative
// diffDays now (it used to lump "already expired" in with "expiring soon";
// BUG 1 fix splits them so an expired policy blocks rather than just warns).
function isInsuranceExpiringSoon(insuranceExpiryDate: string | null, now: Date): boolean {
  if (!insuranceExpiryDate) {
    return false;
  }

  const diffDays = (new Date(insuranceExpiryDate).getTime() - now.getTime()) / MS_PER_DAY;
  return diffDays >= 0 && diffDays <= EXPIRING_WITHIN_DAYS;
}

function isInsuranceExpired(insuranceExpiryDate: string | null, now: Date): boolean {
  if (!insuranceExpiryDate) {
    return false;
  }

  const diffDays = (new Date(insuranceExpiryDate).getTime() - now.getTime()) / MS_PER_DAY;
  return diffDays < 0;
}

// "unknown" is mapRowToCarrier()'s fallback for a carrier that has never
// been verified (authority_status is null in the DB) -- that must fall
// through to the lastVerifiedAt check below, not read as blocked. Real
// FMCSA statusCode values seen live: "A" (active) and "I" (inactive); any
// other non-null code is treated the same as "I" until more are observed.
function isAuthorityInactive(authorityStatus: string | null): boolean {
  if (!authorityStatus || authorityStatus === "unknown") {
    return false;
  }
  return authorityStatus.trim().toUpperCase() !== "A";
}

export interface DispatchEligibilityRequirements {
  minCargoCents: Cents;
  minAutoLiabilityCents: Cents;
}

export interface DispatchEligibilityResult {
  eligible: boolean;
  reasons: string[];
}

// Real columns back every check here now: carriers.authority_status,
// carriers.last_verified_at (047_carrier_verification_columns.sql), and
// carriers.is_blacklisted/insurance_expiry_date
// (049_carrier_compliance_columns.sql). safetyRating and outOfServiceDate
// from verificationResult are still not read here; they're persisted (see
// updateCarrierVerification) for display/future use, not folded into this
// determination.
//
// BUG 1 fix: insurance_expiry_date and FMCSA verification are independent
// signals, each evaluated on its own -- neither gates the other. Previously
// `!carrier.lastVerifiedAt` was checked before the insurance-expiry checks,
// so a never-verified carrier with insurance expiring in 5 days reported
// "unverified" (grey) instead of "expiring" (amber): the near-term
// insurance signal was silently masked. Order now is severity-first
// (blacklist/authority-inactive, then lapsed insurance, then near-term
// insurance) with "unverified" only as the final fallback when nothing
// else -- including insurance -- has anything to say, and "verified" only
// once both signals are clean.
export function deriveComplianceBadge(
  carrier: Carrier,
  verificationResult: CarrierVerificationResult,
  now: Date = new Date()
): ComplianceBadge {
  if (carrier.isBlacklisted || isAuthorityInactive(verificationResult.authorityStatus)) {
    return "blocked";
  }

  if (isInsuranceExpired(carrier.insuranceExpiryDate, now)) {
    return "blocked";
  }

  if (isInsuranceExpiringSoon(carrier.insuranceExpiryDate, now)) {
    return "expiring";
  }

  if (!carrier.lastVerifiedAt) {
    return "unverified";
  }

  return "verified";
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
  if (isInsuranceExpired(carrier.insuranceExpiryDate, now)) {
    reasons.push("Carrier insurance has expired");
  } else if (isInsuranceExpiringSoon(carrier.insuranceExpiryDate, now)) {
    reasons.push("Carrier insurance is expiring within 30 days");
  }

  return { eligible: reasons.length === 0, reasons };
}
