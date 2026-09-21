"use client";

import React, { useState } from "react";
import { CheckoutModal } from "./checkout-modal";

/**
 * Opens the same no-card 7-day trial checkout as the Growth pricing card's
 * "Start Free Trial" button. Used by CTAs outside the pricing section
 * (hero, navbar) that don't have a tier-specific context to work from.
 */
export function StartTrialButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className={className}>
        {children}
      </button>
      {isOpen && (
        <CheckoutModal
          tier="growth"
          mode="trial"
          billingInterval="monthly"
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
