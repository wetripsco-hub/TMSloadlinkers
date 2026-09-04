import { AlertTriangle, Clock } from "lucide-react";
import type { CurrentSubscription } from "@/lib/repositories/dashboard";

function daysRemaining(trialEndsAt: string): number {
  const msRemaining = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
}

export function TrialBanner({ subscription }: { subscription: CurrentSubscription | null }) {
  if (!subscription || (subscription.state !== "trialing" && subscription.state !== "past_due")) {
    return null;
  }

  if (subscription.state === "past_due") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/30 dark:bg-rose-500/10">
        <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
        <p className="text-sm font-medium text-rose-800 dark:text-rose-300">
          Your last payment failed. Update your billing details to avoid losing access.
        </p>
      </div>
    );
  }

  const remaining = daysRemaining(subscription.trialEndsAt);
  const urgent = remaining <= 3;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-4 ${
        urgent
          ? "border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
          : "border-brand-200 bg-brand-50/70 dark:border-brand-500/30 dark:bg-brand-500/10"
      }`}
    >
      <Clock
        className={`h-5 w-5 shrink-0 ${
          urgent ? "text-amber-600 dark:text-amber-400" : "text-brand-600 dark:text-brand-400"
        }`}
      />
      <p
        className={`text-sm font-medium ${
          urgent ? "text-amber-800 dark:text-amber-300" : "text-brand-800 dark:text-brand-300"
        }`}
      >
        {remaining === 0
          ? "Your trial ends today."
          : `${remaining} day${remaining === 1 ? "" : "s"} left in your trial.`}
        {urgent && " Add a payment method to keep your workspace active."}
      </p>
    </div>
  );
}
