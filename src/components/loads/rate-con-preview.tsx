"use client";

import React from "react";
import { RateConfirmationView } from "@/components/documents/rate-confirmation-view";
import {
  RateConfirmationModal,
  type RateConfirmationModalProps,
} from "@/components/documents/rate-confirmation-modal";
import type { Carrier, Load, Organization } from "../../../types/domain";

export interface RateConPreviewProps {
  load: Load;
  carrier?: (Carrier & { contactEmail?: string | null; contactPhone?: string | null }) | null;
  organization?: Organization | null;
  organizationName?: string;
  className?: string;
}

/**
 * Rate Confirmation Preview Component
 * Binds dynamically to active organization branding (Name, MC/DOT, Contact)
 * and renders stops with full facility addresses.
 */
export function RateConPreview({
  load,
  carrier,
  organization,
}: RateConPreviewProps) {
  return (
    <RateConfirmationView
      load={load}
      carrier={carrier || null}
      organization={organization || null}
    />
  );
}

export { RateConfirmationModal };
export type { RateConfirmationModalProps };
export default RateConPreview;
