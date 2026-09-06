import { redirect } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { getAdminContext } from "@/lib/auth/require-admin";
import { getSubscriptionSummary } from "@/lib/repositories/subscription";
import { PLANS } from "@/lib/stripe/plans";
import { CurrentPlanPanel } from "@/components/billing/current-plan-panel";
import { PlanCard } from "@/components/billing/plan-card";

export const dynamic = "force-dynamic";

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const [admin, { checkout }] = await Promise.all([getAdminContext(), searchParams]);

  if (!admin) {
    redirect("/overview");
  }

  const subscription = await getSubscriptionSummary();

  return (
    <div className="space-y-6">
      {checkout === "success" && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Your subscription is being set up. It may take a moment to appear below.
        </div>
      )}
      {checkout === "cancelled" && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
          <XCircle className="h-4 w-4 shrink-0" />
          Checkout was cancelled. No changes were made to your plan.
        </div>
      )}

      {subscription ? (
        <CurrentPlanPanel subscription={subscription} />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-xs">
          No subscription found for this organization yet.
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-900">Plans</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          {Object.values(PLANS).map((plan) => (
            <PlanCard key={plan.tier} plan={plan} isCurrent={subscription?.plan === plan.tier} />
          ))}
        </div>
      </div>
    </div>
  );
}
