"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe/client";
import { PLANS, type PlanTier } from "@/lib/stripe/plans";
import { getAdminContext } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";

async function resolveBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}

async function getOrCreateStripeCustomerId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  userId: string
): Promise<string> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("org_id", orgId)
    .maybeSingle();

  if (subscription?.stripe_customer_id) {
    return subscription.stripe_customer_id;
  }

  const [{ data: profile }, { data: org }] = await Promise.all([
    supabase.from("profiles").select("email").eq("id", userId).maybeSingle(),
    supabase.from("organizations").select("name").eq("id", orgId).maybeSingle(),
  ]);

  const customer = await stripe.customers.create({
    email: profile?.email ?? undefined,
    name: org?.name ?? undefined,
    metadata: { org_id: orgId },
  });

  const { error } = await supabase
    .from("subscriptions")
    .update({ stripe_customer_id: customer.id })
    .eq("org_id", orgId);

  if (error) throw error;

  return customer.id;
}

export async function createCheckoutSession(tier: PlanTier) {
  const admin = await getAdminContext();
  if (!admin) {
    throw new Error("You must be an org admin to manage billing");
  }

  const plan = PLANS[tier];
  if (!plan.stripePriceId) {
    throw new Error(`Plan "${tier}" is not checkoutable`);
  }

  const supabase = await createClient();
  const customerId = await getOrCreateStripeCustomerId(supabase, admin.orgId, admin.userId);
  const baseUrl = await resolveBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: admin.orgId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    metadata: { org_id: admin.orgId },
    subscription_data: { metadata: { org_id: admin.orgId } },
    success_url: `${baseUrl}/settings/billing?checkout=success`,
    cancel_url: `${baseUrl}/settings/billing?checkout=cancelled`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  redirect(session.url);
}

export async function createPortalSession() {
  const admin = await getAdminContext();
  if (!admin) {
    throw new Error("You must be an org admin to manage billing");
  }

  const supabase = await createClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("org_id", admin.orgId)
    .maybeSingle();

  if (!subscription?.stripe_customer_id) {
    throw new Error("No billing account found for this organization yet");
  }

  const baseUrl = await resolveBaseUrl();

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${baseUrl}/settings/billing`,
  });

  redirect(session.url);
}
