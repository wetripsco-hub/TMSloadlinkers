"use client";

import { useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { createCheckoutSession } from "@/app/(dashboard)/settings/billing/actions";
import type { PlanDefinition } from "@/lib/stripe/plans";

const FEATURES: Record<string, string[]> = {
  starter: ["3 seats", "Unlimited loads", "Rate confirmations", "Basic reporting"],
  growth: ["10 seats", "Everything in Starter", "Carrier compliance tracking", "Priority support"],
  enterprise: ["50 seats", "Everything in Growth", "Custom integrations", "Dedicated account manager"],
};

const PRICE_LABELS: Record<string, string> = {
  starter: "Free trial",
  growth: "$149/mo",
  enterprise: "$399/mo",
};

export function PlanCard({
  plan,
  isCurrent,
}: {
  plan: PlanDefinition;
  isCurrent: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const features = FEATURES[plan.tier] ?? [];

  const handleUpgrade = () => {
    startTransition(() => {
      createCheckoutSession(plan.tier).catch((error) => {
        console.error(error);
      });
    });
  };

  return (
    <div
      className={`flex flex-col rounded-2xl border p-5 shadow-xs dark:bg-gray-900/60 md:p-6 ${
        isCurrent
          ? "border-brand-300 bg-brand-50/40 dark:border-brand-700 dark:bg-brand-950/20"
          : "border-gray-200 bg-white dark:border-gray-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
        {isCurrent && (
          <span className="rounded-full bg-brand-500/15 px-2.5 py-0.5 text-[11px] font-bold text-brand-600 dark:text-brand-400">
            Current plan
          </span>
        )}
      </div>

      <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {PRICE_LABELS[plan.tier] ?? ""}
      </p>

      <ul className="mt-4 flex-1 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            {feature}
          </li>
        ))}
      </ul>

      {!isCurrent && plan.stripePriceId && (
        <button
          type="button"
          onClick={handleUpgrade}
          disabled={isPending}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Upgrade to {plan.name}
        </button>
      )}
    </div>
  );
}
