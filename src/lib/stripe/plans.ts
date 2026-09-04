export type PlanTier = "starter" | "growth" | "enterprise";

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  seatLimit: number;
  stripePriceId: string | null;
}

export const PLANS: Record<PlanTier, PlanDefinition> = {
  starter: {
    tier: "starter",
    name: "Starter",
    seatLimit: 3,
    stripePriceId: null,
  },
  growth: {
    tier: "growth",
    name: "Growth",
    seatLimit: 10,
    stripePriceId: process.env.STRIPE_PRICE_GROWTH ?? null,
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    seatLimit: 50,
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE ?? null,
  },
};

export const CHECKOUTABLE_PLANS: PlanDefinition[] = [PLANS.growth, PLANS.enterprise];

export function tierForPriceId(priceId: string): PlanTier | null {
  const match = CHECKOUTABLE_PLANS.find((plan) => plan.stripePriceId === priceId);
  return match ? match.tier : null;
}
