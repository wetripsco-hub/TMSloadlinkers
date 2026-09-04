import { listCarriers } from "@/lib/repositories/carriers";
import { CarrierTable } from "@/components/carriers/carrier-table";
import { CarrierOnboardDialog } from "@/components/carriers/carrier-onboard-dialog";
import { PageBreadcrumb } from "@/components/common/PageBreadCrumb";
import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import { deriveStoredComplianceBadge } from "@/components/carriers/compliance-badge";
import { Truck, ShieldCheck, AlertTriangle, ShieldX } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CarriersPage() {
  const { data: carriers } = await listCarriers({}, { page: 1, pageSize: 100 });

  // Calculate compliance statistics
  let verifiedCount = 0;
  let expiringCount = 0;
  let blockedCount = 0;
  let unverifiedCount = 0;

  carriers.forEach((carrier) => {
    const badge = deriveStoredComplianceBadge(carrier);
    if (badge === "verified") verifiedCount++;
    else if (badge === "expiring") expiringCount++;
    else if (badge === "blocked") blockedCount++;
    else unverifiedCount++;
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header with Action */}
      <PageBreadcrumb pageTitle="Carriers & Fleets">
        <CarrierOnboardDialog />
      </PageBreadcrumb>

      {/* KPI Ribbon Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Carriers"
          value={carriers.length}
          icon={<Truck className="h-6 w-6 text-brand-500" />}
          badgeText="Active Network"
          badgeColor="primary"
          subtitle={`${unverifiedCount} pending verification`}
        />

        <MetricCard
          title="Verified Compliance"
          value={verifiedCount}
          icon={<ShieldCheck className="h-6 w-6 text-emerald-500" />}
          badgeText={verifiedCount > 0 ? "Dispatch Ready" : "0 Verified"}
          badgeColor="success"
          subtitle="FMCSA authority active & insured"
        />

        <MetricCard
          title="Expiring Authority"
          value={expiringCount}
          icon={<AlertTriangle className="h-6 w-6 text-amber-500" />}
          badgeText={expiringCount > 0 ? "Renewal Needed" : "All Good"}
          badgeColor={expiringCount > 0 ? "warning" : "light"}
          subtitle="Insurance expiring within 30 days"
        />

        <MetricCard
          title="Blocked / Blacklisted"
          value={blockedCount}
          icon={<ShieldX className="h-6 w-6 text-rose-500" />}
          badgeText={blockedCount > 0 ? "Restricted" : "Clean"}
          badgeColor={blockedCount > 0 ? "error" : "light"}
          subtitle="Under audit or do not dispatch"
        />
      </div>

      {/* Modern Data Table */}
      <CarrierTable carriers={carriers} />
    </div>
  );
}
