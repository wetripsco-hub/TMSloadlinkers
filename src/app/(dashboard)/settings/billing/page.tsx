import { redirect } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { getAdminContext } from "@/lib/auth/require-admin";
import { getSubscriptionSummary } from "@/lib/repositories/subscription";
import { PLANS } from "@/lib/stripe/plans";
import { PageBreadcrumb } from "@/components/common/PageBreadCrumb";
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
      <PageBreadcrumb pageTitle="Billing" />

      {checkout === "success" && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Your subscription is being set up. It may take a moment to appear below.
        </div>
      )}
      {checkout === "cancelled" && (
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300">
          <XCircle className="h-4 w-4 shrink-0" />
          Checkout was cancelled. No changes were made to your plan.
        </div>
      )}

      {subscription ? (
        <CurrentPlanPanel subscription={subscription} />
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500 shadow-xs dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-400">
          No subscription found for this organization yet.
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Plans</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          {Object.values(PLANS).map((plan) => (
            <PlanCard key={plan.tier} plan={plan} isCurrent={subscription?.plan === plan.tier} />
          ))}
        </div>
      </div>
    </div>
  );
}
