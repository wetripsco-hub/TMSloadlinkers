import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { PLANS, tierForPriceId, type PlanTier } from "@/lib/stripe/plans";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ServiceClient = ReturnType<typeof createServiceClient>;
type SubscriptionState = "trialing" | "active" | "past_due" | "canceled" | "expired";

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionState {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "paused":
      return "canceled";
    case "incomplete_expired":
      return "expired";
    case "incomplete":
    default:
      return "trialing";
  }
}

function planTierFromSubscription(subscription: Stripe.Subscription): PlanTier {
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) return "starter";
  return tierForPriceId(priceId) ?? "starter";
}

async function resolveOrgIdForCustomer(
  supabase: ServiceClient,
  customerId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("subscriptions")
    .select("org_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return data?.org_id ?? null;
}

async function extractCardDetails(subscription: Stripe.Subscription) {
  const pm = subscription.default_payment_method;
  if (!pm) return {};

  const paymentMethod =
    typeof pm === "string" ? await stripe.paymentMethods.retrieve(pm) : pm;

  if (!paymentMethod.card) return {};

  return {
    card_brand: paymentMethod.card.brand,
    card_last4: paymentMethod.card.last4,
    card_exp_month: paymentMethod.card.exp_month,
    card_exp_year: paymentMethod.card.exp_year,
  };
}

async function applySubscription(
  supabase: ServiceClient,
  orgId: string,
  subscription: Stripe.Subscription
) {
  const tier = planTierFromSubscription(subscription);
  const state = mapStripeStatus(subscription.status);
  const card = await extractCardDetails(subscription);
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

  const { error } = await supabase.from("subscriptions").upsert(
    {
      org_id: orgId,
      stripe_customer_id:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      stripe_subscription_id: subscription.id,
      plan: tier,
      state,
      seat_limit: PLANS[tier].seatLimit,
      current_period_end: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : new Date().toISOString(),
      ...card,
    },
    { onConflict: "org_id" }
  );

  if (error) throw error;
}

async function markPastDue(supabase: ServiceClient, orgId: string) {
  const { error } = await supabase
    .from("subscriptions")
    .update({ state: "past_due" })
    .eq("org_id", orgId);

  if (error) throw error;
}

async function handleCheckoutCompleted(
  supabase: ServiceClient,
  session: Stripe.Checkout.Session
) {
  const orgId = session.client_reference_id ?? session.metadata?.org_id;
  if (!orgId || !session.subscription) return;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["default_payment_method"],
  });

  await applySubscription(supabase, orgId, subscription);
}

async function handleSubscriptionUpdated(
  supabase: ServiceClient,
  subscription: Stripe.Subscription
) {
  const orgId =
    subscription.metadata?.org_id ??
    (await resolveOrgIdForCustomer(
      supabase,
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id
    ));
  if (!orgId) return;

  await applySubscription(supabase, orgId, subscription);
}

async function handleSubscriptionDeleted(
  supabase: ServiceClient,
  subscription: Stripe.Subscription
) {
  const orgId =
    subscription.metadata?.org_id ??
    (await resolveOrgIdForCustomer(
      supabase,
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id
    ));
  if (!orgId) return;

  const { error } = await supabase
    .from("subscriptions")
    .update({ state: "canceled", cancel_at_period_end: false })
    .eq("org_id", orgId);

  if (error) throw error;
}

async function handleInvoicePaymentFailed(
  supabase: ServiceClient,
  invoice: Stripe.Invoice
) {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const orgId = await resolveOrgIdForCustomer(supabase, customerId);
  if (!orgId) return;

  await markPastDue(supabase, orgId);
}

function resolveOrgIdFromEvent(event: Stripe.Event): string | undefined {
  const obj = event.data.object as { metadata?: { org_id?: string }; client_reference_id?: string };
  return obj.metadata?.org_id ?? obj.client_reference_id ?? undefined;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { error: insertError } = await supabase.from("stripe_events").insert({
    id: event.id,
    type: event.type,
    org_id: resolveOrgIdFromEvent(event) ?? null,
    payload: event as unknown as never,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ duplicate: true });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(supabase, event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(supabase, event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
