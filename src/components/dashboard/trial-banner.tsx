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
      <div className="flex items-center gap-3 rounded-md border border-rose-200 bg-rose-50 p-4 shadow-sm">
        <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
        <p className="text-sm font-medium text-rose-800">
          Your last payment failed. Update your billing details to avoid losing access.
        </p>
      </div>
    );
  }

  const remaining = daysRemaining(subscription.trialEndsAt);
  const urgent = remaining <= 3;

  return (
    <div
      className={`flex items-center gap-3 rounded-md border p-4 shadow-xs ${
        urgent
          ? "border-amber-200 bg-amber-50/90"
          : "border-blue-200 bg-blue-50/80"
      }`}
    >
      <Clock
        className={`h-5 w-5 shrink-0 ${
          urgent ? "text-amber-600" : "text-blue-600"
        }`}
      />
      <p
        className={`text-sm font-medium ${
          urgent ? "text-amber-900" : "text-blue-800"
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
