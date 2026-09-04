import React from "react";
import { deriveComplianceBadge } from "@/lib/domain/carrier-compliance";
import { Badge, type BadgeColor } from "@/components/ui/tailadmin/badge";
import { CheckCircle, AlertTriangle, ShieldX, HelpCircle } from "lucide-react";
import type {
  Carrier,
  CarrierVerificationResult,
  ComplianceBadge as ComplianceBadgeValue,
} from "../../../types/domain";

const BADGE_CONFIG: Record<
  ComplianceBadgeValue,
  { label: string; color: BadgeColor; icon: React.ReactNode }
> = {
  verified: {
    label: "Verified",
    color: "success",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  expiring: {
    label: "Expiring",
    color: "warning",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  blocked: {
    label: "Blocked",
    color: "error",
    icon: <ShieldX className="h-3 w-3" />,
  },
  unverified: {
    label: "Unverified",
    color: "light",
    icon: <HelpCircle className="h-3 w-3" />,
  },
};

export function ComplianceStatusBadge({ badge }: { badge: ComplianceBadgeValue }) {
  const config = BADGE_CONFIG[badge] || BADGE_CONFIG.unverified;

  return (
    <Badge color={config.color} size="sm" startIcon={config.icon}>
      {config.label}
    </Badge>
  );
}

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
