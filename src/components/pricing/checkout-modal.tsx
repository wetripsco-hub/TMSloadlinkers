"use client";

import React, { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { PLANS, TRIAL_PERIOD_DAYS, type PlanTier, type BillingInterval } from "@/lib/stripe/plans";
import { startSelfServeCheckout, type SelfServeCheckoutMode } from "@/lib/stripe/self-serve-checkout";

export function CheckoutModal({
  tier,
  mode,
  billingInterval,
  onClose,
}: {
  tier: PlanTier;
  mode: SelfServeCheckoutMode;
  billingInterval: BillingInterval;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const plan = PLANS[tier];
  const price = billingInterval === "annual" ? plan.annualPriceUsd : plan.monthlyPriceUsd;
  const unit = billingInterval === "annual" ? "yr" : "mo";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(() => {
      startSelfServeCheckout(tier, mode, email, billingInterval)
        .then(({ url }) => {
          window.location.href = url;
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Something went wrong");
        });
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-slate-900">
          {mode === "trial" ? `Start your ${TRIAL_PERIOD_DAYS}-day free trial` : `Buy ${plan.name} now`}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {mode === "trial"
            ? `No credit card required. Try ${plan.name} free for ${TRIAL_PERIOD_DAYS} days — add a card any time to keep your workspace active after the trial.`
            : `You'll be charged $${price}/${unit} starting today.`}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{mode === "trial" ? "Start free trial — no card" : "Continue to checkout"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
