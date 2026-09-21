export type PlanTier = "starter" | "growth" | "enterprise";
export type BillingInterval = "monthly" | "annual";

export const TRIAL_PERIOD_DAYS = 7;
export const ANNUAL_DISCOUNT_LABEL = "Save 10% billed yearly";

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  tagline: string;
  seatLimit: number;
  seatLabel: string;
  /** Fixed monthly price in USD, or null for Enterprise's custom pricing. */
  monthlyPriceUsd: number | null;
  /** Fixed annual price in USD (~10% off 12x monthly), or null where annual billing isn't offered. */
  annualPriceUsd: number | null;
  /** Shown next to the price for tiers where it varies (Enterprise). */
  priceNote: string | null;
  /** OCR documents/month, or null for unlimited. */
  ocrLimitPerMonth: number | null;
  ocrLimitLabel: string;
  ocrFootnote: string | null;
  prioritySupport: boolean;
  /** True for Starter and Growth: self-serve checkout, no sales contact. */
  selfServe: boolean;
  isPopular: boolean;
  ctaLabel: string;
  features: string[];
  stripePriceId: string | null;
  /** Stripe price for annual billing, or null where annual billing isn't offered. */
  stripePriceIdAnnual: string | null;
}

export const PLANS: Record<PlanTier, PlanDefinition> = {
  starter: {
    tier: "starter",
    name: "Starter",
    tagline: "For small brokerages and single-dispatcher operations.",
    seatLimit: 2,
    seatLabel: "2 seats",
    monthlyPriceUsd: 49,
    annualPriceUsd: 529,
    priceNote: null,
    ocrLimitPerMonth: 50,
    ocrLimitLabel: "50 documents / month",
    ocrFootnote: null,
    prioritySupport: false,
    selfServe: true,
    isPopular: false,
    ctaLabel: "Get Started",
    features: [
      "2 dispatcher seats",
      "Core load management (create, dispatch, track)",
      "Instant rate confirmations & invoicing",
      "Carrier & customer directory",
      "50 OCR documents / month",
      "Email support",
    ],
    stripePriceId: process.env.STRIPE_PRICE_STARTER ?? null,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_STARTER_ANNUAL ?? null,
  },
  growth: {
    tier: "growth",
    name: "Growth",
    tagline: "The modern standard for high-volume dispatchers and growing teams.",
    seatLimit: 5,
    seatLabel: "5 seats",
    monthlyPriceUsd: 89,
    annualPriceUsd: 961,
    priceNote: null,
    ocrLimitPerMonth: 250,
    ocrLimitLabel: "250 documents / month",
    ocrFootnote: null,
    prioritySupport: true,
    selfServe: true,
    isPopular: true,
    ctaLabel: "Get Started",
    features: [
      "5 dispatcher seats",
      "Everything in Starter",
      "FMCSA carrier compliance tracking",
      "250 OCR documents / month",
      "Priority support",
    ],
    stripePriceId: process.env.STRIPE_PRICE_GROWTH ?? null,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_GROWTH_ANNUAL ?? null,
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    tagline: "Full-scale logistics cloud for large 3PLs and enterprise fleets.",
    seatLimit: 50,
    seatLabel: "50+ seats",
    monthlyPriceUsd: 600,
    annualPriceUsd: null,
    priceNote: "Price varies based on your requirements",
    ocrLimitPerMonth: null,
    ocrLimitLabel: "Unlimited*",
    ocrFootnote: "*Fair use policy applies",
    prioritySupport: true,
    selfServe: false,
    isPopular: false,
    ctaLabel: "Talk to Us",
    features: [
      "50+ dispatcher seats",
      "Everything in Growth",
      "Unlimited* OCR documents / month",
      "Custom integrations — available on request",
      "Dedicated priority support",
    ],
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE ?? null,
    stripePriceIdAnnual: null,
  },
};

/** Tiers that go through Stripe Checkout directly (no sales contact). */
export const CHECKOUTABLE_PLANS: PlanDefinition[] = [PLANS.starter, PLANS.growth];

export function tierForPriceId(priceId: string): PlanTier | null {
  const match = Object.values(PLANS).find(
    (plan) => plan.stripePriceId === priceId || plan.stripePriceIdAnnual === priceId
  );
  return match ? match.tier : null;
}
