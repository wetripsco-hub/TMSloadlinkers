"use client";

import { useTransition } from "react";
import { CreditCard, Users, Loader2 } from "lucide-react";
import Badge, { type BadgeColor } from "@/components/ui/tailadmin/badge";
import { createPortalSession } from "@/app/(dashboard)/settings/billing/actions";
import type { SubscriptionSummary } from "@/lib/repositories/subscription";

const STATE_BADGE: Record<SubscriptionSummary["state"], { label: string; color: BadgeColor }> = {
  trialing: { label: "Trialing", color: "info" },
  active: { label: "Active", color: "success" },
  past_due: { label: "Past Due", color: "warning" },
  canceled: { label: "Canceled", color: "error" },
  expired: { label: "Expired", color: "error" },
};

export function CurrentPlanPanel({ subscription }: { subscription: SubscriptionSummary }) {
  const [isPending, startTransition] = useTransition();

  const stateBadge = STATE_BADGE[subscription.state];
  const isUrgent =
    subscription.trialDaysRemaining !== null && subscription.trialDaysRemaining <= 3;

  const handleManageBilling = () => {
    startTransition(() => {
      createPortalSession().catch((error) => {
        console.error(error);
      });
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900/60 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {subscription.planName} plan
            </h3>
            <Badge color={stateBadge.color} size="sm">
              {stateBadge.label}
            </Badge>
          </div>
          {subscription.trialDaysRemaining !== null && (
            <p
              className={`mt-1 text-sm ${
                isUrgent
                  ? "font-semibold text-rose-600 dark:text-rose-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {subscription.trialDaysRemaining === 0
                ? "Trial ends today"
                : `${subscription.trialDaysRemaining} day${
                    subscription.trialDaysRemaining === 1 ? "" : "s"
                  } left in trial`}
            </p>
          )}
          {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
              Cancels on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleManageBilling}
          disabled={isPending || !subscription.stripeCustomerId}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-xs transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          Manage billing
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Seats used</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {subscription.seatsUsed} / {subscription.seatLimit}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Payment method</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {subscription.card.display ?? "No card on file"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
