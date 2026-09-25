"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe/client";
import { PLANS, TRIAL_PERIOD_DAYS, type BillingInterval, type PlanTier } from "@/lib/stripe/plans";

export type SelfServeCheckoutMode = "trial" | "buy_now";

async function resolveBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}

/**
 * Pre-signup Stripe Checkout for Starter/Growth/Enterprise -- all three are
 * self-serve (Enterprise included) with the same trial/buy-now and
 * monthly/annual options. Unlike createCheckoutSession (dashboard, requires
 * an existing org admin), this has no authenticated org to attach to yet --
 * Stripe creates the customer from `email` directly.
 *
 * NOTE: the checkout.session.completed webhook currently no-ops when it
 * can't resolve an org_id (see src/app/api/stripe/webhook/route.ts), and no
 * org exists at this point in this flow. Linking the resulting Stripe
 * subscription to the org created during signup is NOT implemented here --
 * see conversation notes. Do not treat a successful redirect as a fully
 * provisioned account.
 */
export async function startSelfServeCheckout(
  tier: PlanTier,
  mode: SelfServeCheckoutMode,
  email: string,
  billingInterval: BillingInterval
) {
  if (tier !== "starter" && tier !== "growth" && tier !== "enterprise") {
    throw new Error(`Plan "${tier}" is not self-serve`);
  }

  const trimmedEmail = email.trim();
  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    throw new Error("A valid email is required");
  }

  const plan = PLANS[tier];
  const priceId = billingInterval === "annual" ? plan.stripePriceIdAnnual : plan.stripePriceId;
  if (!priceId) {
    const intervalLabel = billingInterval === "annual" ? "annual" : "monthly";
    throw new Error(
      `Checkout for "${plan.name}" (${intervalLabel}) isn't configured yet — its Stripe price ID is missing.`
    );
  }

  const baseUrl = await resolveBaseUrl();

  // Trial mode: don't force card entry up front (payment_method_collection:
  // "if_required" means Stripe only asks for a card if something is due
  // today -- a pure trial has $0 due). If the trial ends and no card was
  // ever added, trial_settings.end_behavior cancels the subscription
  // instead of trying to charge a nonexistent payment method. That
  // "customer.subscription.deleted" event already flows through the
  // existing handleSubscriptionDeleted() webhook handler, which sets
  // subscriptions.state = 'canceled' -- and getAccessStatus() already
  // locks write access on 'canceled'. No new expiry logic needed here.
  //
  // Buy-now mode is unaffected: Stripe's default "always" collects a card
  // before completing checkout, same as before.
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: trimmedEmail,
    payment_method_collection: mode === "trial" ? "if_required" : "always",
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { plan_tier: tier, checkout_mode: mode, billing_interval: billingInterval },
    subscription_data: {
      metadata: { plan_tier: tier, checkout_mode: mode, billing_interval: billingInterval },
      ...(mode === "trial"
        ? {
            trial_period_days: TRIAL_PERIOD_DAYS,
            trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
          }
        : {}),
    },
    success_url: `${baseUrl}/signup?checkout=success&plan=${tier}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/?checkout=cancelled#pricing`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  redirect(session.url);
}
