"use client";

import React, { useState, useTransition } from "react";
import { Check, Minus, Sparkles, ArrowRight, ShieldCheck, X, Loader2 } from "lucide-react";
import {
  PLANS,
  TRIAL_PERIOD_DAYS,
  ANNUAL_DISCOUNT_LABEL,
  type PlanTier,
  type BillingInterval,
} from "@/lib/stripe/plans";
import { type SelfServeCheckoutMode } from "@/lib/stripe/self-serve-checkout";
import { submitEnterpriseInquiry } from "@/app/actions/enterprise-inquiry";
import { CheckoutModal } from "./checkout-modal";

const plans = [PLANS.starter, PLANS.growth, PLANS.enterprise];

const COMPARISON_ROWS: {
  label: string;
  values: Record<PlanTier, string>;
}[] = [
  {
    label: "Seats",
    values: { starter: PLANS.starter.seatLabel, growth: PLANS.growth.seatLabel, enterprise: PLANS.enterprise.seatLabel },
  },
  {
    label: "OCR documents / month",
    values: {
      starter: PLANS.starter.ocrLimitLabel,
      growth: PLANS.growth.ocrLimitLabel,
      enterprise: PLANS.enterprise.ocrLimitLabel,
    },
  },
  { label: "Core load management", values: { starter: "yes", growth: "yes", enterprise: "yes" } },
  { label: "Rate confirmations & invoicing", values: { starter: "yes", growth: "yes", enterprise: "yes" } },
  { label: "Carrier compliance tracking (FMCSA)", values: { starter: "no", growth: "yes", enterprise: "yes" } },
  { label: "Priority support", values: { starter: "no", growth: "yes", enterprise: "yes" } },
  { label: "Custom integrations", values: { starter: "no", growth: "no", enterprise: "On request" } },
];

function ComparisonCell({ value }: { value: string }) {
  if (value === "yes") return <Check className="w-4 h-4 text-emerald-600 mx-auto" />;
  if (value === "no") return <Minus className="w-4 h-4 text-slate-300 mx-auto" />;
  return <span className="text-xs sm:text-sm text-slate-700">{value}</span>;
}

function EnterpriseInquiryModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(() => {
      submitEnterpriseInquiry({ name, email, message }).then((result) => {
        if (result.error) setError(result.error);
        else setSent(true);
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

        {sent ? (
          <div className="py-6 text-center space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Thanks — we&apos;ll be in touch</h3>
            <p className="text-sm text-slate-600">
              Our team will reach out about Enterprise pricing and integrations shortly.
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-slate-900">Talk to us about Enterprise</h3>
            <p className="mt-1 text-sm text-slate-600">
              Tell us about your fleet size and any integrations you need. We&apos;ll follow up by email.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <input
                type="text"
                required
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                required
                rows={3}
                placeholder="What do you need? (fleet size, integrations, timeline)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <button
                type="submit"
                disabled={isPending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Submit</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export function PricingSection() {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [modal, setModal] = useState<
    | { kind: "checkout"; tier: PlanTier; mode: SelfServeCheckoutMode }
    | { kind: "enterprise" }
    | null
  >(null);

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-slate-50 border-t border-slate-200/80 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            <span>Flexible Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Transparent Brokerage Plans
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Choose the right plan for your dispatch operations. Starter and Growth include a{" "}
            {TRIAL_PERIOD_DAYS}-day free trial — no credit card required.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span
              onClick={() => setBillingInterval("monthly")}
              className={`text-sm font-semibold cursor-pointer transition-colors ${
                billingInterval === "monthly" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Monthly Billing
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={billingInterval === "annual"}
              onClick={() => setBillingInterval(billingInterval === "annual" ? "monthly" : "annual")}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                billingInterval === "annual" ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  billingInterval === "annual" ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>

            <span
              onClick={() => setBillingInterval("annual")}
              className={`text-sm font-semibold cursor-pointer transition-colors flex items-center gap-2 ${
                billingInterval === "annual" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>Annual Billing</span>
              <span className="font-bold text-[11px] py-0.5 px-2 text-emerald-700 bg-emerald-100 border border-emerald-300 rounded-full">
                Save 10%
              </span>
            </span>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isAnnual = billingInterval === "annual" && plan.annualPriceUsd !== null;
            const displayPrice = isAnnual ? plan.annualPriceUsd : plan.monthlyPriceUsd;
            const priceUnit = isAnnual ? "year" : "month";

            return (
              <div
                key={plan.tier}
                className={`relative rounded-2xl p-7 flex flex-col justify-between transition-all duration-300 bg-white border ${
                  plan.isPopular
                    ? "border-2 border-blue-600 ring-4 ring-blue-50 shadow-lg lg:-translate-y-2"
                    : "border-slate-200 shadow-sm hover:shadow-md"
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                      <Sparkles className="w-3.5 h-3.5" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {plan.seatLabel}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 min-h-[40px] leading-relaxed">
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="my-6 pb-6 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                        {displayPrice !== null ? `$${displayPrice}` : "Custom"}
                      </span>
                      {displayPrice !== null && (
                        <span className="text-slate-600 font-medium text-sm">/ {priceUnit}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">
                      {plan.priceNote ?? (isAnnual ? ANNUAL_DISCOUNT_LABEL : "Billed monthly")}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      What&apos;s included:
                    </div>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-snug">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.ocrFootnote && (
                      <p className="text-[11px] text-slate-400 pt-1">{plan.ocrFootnote}</p>
                    )}
                  </div>
                </div>

                {/* CTAs */}
                <div className="pt-8 mt-6 border-t border-slate-100 space-y-2">
                  {plan.selfServe ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setModal({ kind: "checkout", tier: plan.tier, mode: "trial" })}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                          plan.isPopular
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                        }`}
                      >
                        <span>Start Free Trial</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setModal({ kind: "checkout", tier: plan.tier, mode: "buy_now" })}
                        className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all border border-slate-200 text-slate-700 hover:bg-slate-50"
                      >
                        <span>Buy Now</span>
                      </button>
                      <p className="text-center text-[11px] text-slate-500 pt-1 font-medium">
                        {TRIAL_PERIOD_DAYS}-day free trial · No card required · Cancel anytime
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setModal({ kind: "checkout", tier: plan.tier, mode: "buy_now" })
                          }
                          className="flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm bg-slate-100 hover:bg-slate-200 text-slate-800"
                        >
                          <span>Buy Now</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setModal({ kind: "enterprise" })}
                          className="flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          <span>{plan.ctaLabel}</span>
                        </button>
                      </div>
                      <p className="text-center text-[11px] text-slate-500 pt-1 font-medium">
                        You can also book a call with our team after purchase to help you get set up
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="mt-16 max-w-5xl mx-auto overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left font-bold text-slate-900 px-5 py-3">Compare plans</th>
                {plans.map((plan) => (
                  <th key={plan.tier} className="text-center font-bold text-slate-900 px-5 py-3">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-3 text-slate-700">{row.label}</td>
                  {plans.map((plan) => (
                    <td key={plan.tier} className="px-5 py-3 text-center">
                      <ComparisonCell value={row.values[plan.tier]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Security & Support Note */}
        <div className="mt-14 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-600">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Bank-grade 256-bit encryption &bull; SOC-2 compliant dispatch infrastructure.</span>
          </div>
          <button
            type="button"
            onClick={() => setModal({ kind: "enterprise" })}
            className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 shrink-0"
          >
            <span>Questions? Talk to Sales</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {modal?.kind === "checkout" && (
        <CheckoutModal
          tier={modal.tier}
          mode={modal.mode}
          billingInterval={modal.tier === "enterprise" ? "monthly" : billingInterval}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "enterprise" && <EnterpriseInquiryModal onClose={() => setModal(null)} />}
    </section>
  );
}
