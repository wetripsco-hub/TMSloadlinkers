"use client";

import { useTransition } from "react";
import { CreditCard, Users, Loader2 } from "lucide-react";
import Badge, { type BadgeColor } from "@/components/ui/tailadmin/badge";
import { createPortalSession } from "@/app/(dashboard)/settings/billing/actions";
import { formatDate } from "@/lib/format";
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
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">
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
                  ? "font-semibold text-rose-600"
                  : "text-slate-500"
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
            <p className="mt-1 text-sm text-amber-600">
              Cancels on {formatDate(subscription.currentPeriodEnd)}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleManageBilling}
          disabled={isPending || !subscription.stripeCustomerId}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          Manage billing
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Seats used</p>
            <p className="text-sm font-semibold text-slate-900">
              {subscription.seatsUsed} / {subscription.seatLimit}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Payment method</p>
            <p className="text-sm font-semibold text-slate-900">
              {subscription.card.display ?? "No card on file"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
