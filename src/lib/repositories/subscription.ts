import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanTier } from "@/lib/stripe/plans";
import type { UUID } from "../../../types/domain";

export type SubscriptionState = "trialing" | "active" | "past_due" | "canceled" | "expired";

export interface SubscriptionSummary {
  orgId: UUID;
  plan: PlanTier;
  planName: string;
  state: SubscriptionState;
  seatsUsed: number;
  seatLimit: number;
  trialEndsAt: string;
  trialDaysRemaining: number | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  card: {
    brand: string | null;
    last4: string | null;
    display: string | null;
  };
}

function daysRemaining(target: string): number | null {
  const diffMs = new Date(target).getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export async function getSubscriptionSummary(): Promise<SubscriptionSummary | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.org_id) return null;

  const orgId = profile.org_id as UUID;

  const [{ data: subscription, error: subscriptionError }, { data: seatsUsed, error: seatsError }] =
    await Promise.all([
      supabase.from("subscriptions").select("*").eq("org_id", orgId).maybeSingle(),
      supabase.rpc("seats_used", { p_org_id: orgId }),
    ]);

  if (subscriptionError) throw subscriptionError;
  if (seatsError) throw seatsError;
  if (!subscription) return null;

  const plan = subscription.plan as PlanTier;
  const cardBrand = subscription.card_brand;
  const cardLast4 = subscription.card_last4;

  return {
    orgId,
    plan,
    planName: PLANS[plan]?.name ?? plan,
    state: subscription.state,
    seatsUsed: seatsUsed ?? 0,
    seatLimit: subscription.seat_limit,
    trialEndsAt: subscription.trial_ends_at,
    trialDaysRemaining:
      subscription.state === "trialing" ? daysRemaining(subscription.trial_ends_at) : null,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    stripeCustomerId: subscription.stripe_customer_id,
    card: {
      brand: cardBrand,
      last4: cardLast4,
      display: cardBrand && cardLast4 ? `${capitalize(cardBrand)} •••• ${cardLast4}` : null,
    },
  };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
