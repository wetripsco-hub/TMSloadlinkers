import { deriveComplianceBadge } from "@/lib/domain/carrier-compliance";
import { cn } from "@/lib/utils";
import type {
  Carrier,
  CarrierVerificationResult,
  ComplianceBadge as ComplianceBadgeValue,
} from "../../../types/domain";

const BADGE_LABELS: Record<ComplianceBadgeValue, string> = {
  verified: "Verified",
  expiring: "Expiring",
  blocked: "Blocked",
  unverified: "Unverified",
};

const BADGE_COLORS: Record<ComplianceBadgeValue, string> = {
  verified: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  expiring: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  blocked: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  unverified: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
};

export function ComplianceStatusBadge({ badge }: { badge: ComplianceBadgeValue }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        BADGE_COLORS[badge]
      )}
    >
      {BADGE_LABELS[badge]}
    </span>
  );
}

// The carriers table only persists identification/contact fields (see
// CarrierRecord in lib/repositories/carriers.ts) — there is no stored
// CarrierVerificationResult to derive a badge from. This synthesizes one from
// the Carrier's own fallback fields so deriveComplianceBadge stays the single
// source of truth for the badge rules, yielding an honest "unverified" until
// a real verification is run and persisted.
export function deriveStoredComplianceBadge(carrier: Carrier): ComplianceBadgeValue {
  const verificationResult: CarrierVerificationResult = {
    authorityActive: carrier.authorityStatus === "active",
    safetyRating: carrier.safetyRating,
    insuranceOnFile: carrier.insuranceCarrierName !== null,
    outOfServiceDate: null,
    source: "stored",
    fetchedAt: carrier.lastVerifiedAt ?? new Date(0).toISOString(),
    raw: null,
  };

  return deriveComplianceBadge(carrier, verificationResult);
}
