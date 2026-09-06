import type { Metadata } from "next";
import { listCarriers } from "@/lib/repositories/carriers";
import { CarrierTable } from "@/components/carriers/carrier-table";
import { CarrierOnboardDialog } from "@/components/carriers/carrier-onboard-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import { deriveStoredComplianceBadge } from "@/components/carriers/compliance-badge";
import { Truck, ShieldCheck, AlertTriangle, ShieldX } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Carrier Directory | FreightLink TMS",
};

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
      {/* Standardized Page Header with Action */}
      <PageHeader
        title="Carrier Directory"
        subtitle="Verify safety compliance, manage insurance certificates, and onboard dispatch fleets."
        breadcrumbs={[
          { label: "Directory", href: "/carriers" },
          { label: "Carriers", href: "/carriers" },
        ]}
        action={<CarrierOnboardDialog />}
      />

      {/* KPI Ribbon Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Carriers"
          value={carriers.length}
          icon={<Truck className="h-5 w-5 text-blue-600" />}
          badgeText="Active Network"
          badgeColor="primary"
          subtitle={`${unverifiedCount} pending verification`}
          variant="plausible"
        />

        <MetricCard
          title="Verified Compliance"
          value={verifiedCount}
          icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}
          badgeText={verifiedCount > 0 ? "Dispatch Ready" : "0 Verified"}
          badgeColor="success"
          subtitle="FMCSA authority active & insured"
          variant="plausible"
        />

        <MetricCard
          title="Expiring Authority"
          value={expiringCount}
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          badgeText={expiringCount > 0 ? "Renewal Needed" : "All Good"}
          badgeColor={expiringCount > 0 ? "warning" : "light"}
          subtitle="Insurance expiring within 30 days"
          variant="plausible"
        />

        <MetricCard
          title="Blocked / Blacklisted"
          value={blockedCount}
          icon={<ShieldX className="h-5 w-5 text-rose-600" />}
          badgeText={blockedCount > 0 ? "Restricted" : "Clean"}
          badgeColor={blockedCount > 0 ? "error" : "light"}
          subtitle="Under audit or do not dispatch"
          variant="plausible"
        />
      </div>

      {/* Modern Data Table */}
      <CarrierTable carriers={carriers} />
    </div>
  );
}
