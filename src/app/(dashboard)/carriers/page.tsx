import type { Metadata } from "next";
import { listCarriers } from "@/lib/repositories/carriers";
import { createClient } from "@/lib/supabase/server";
import { CarrierTable } from "@/components/carriers/carrier-table";
import { CarrierOnboardDialog } from "@/components/carriers/carrier-onboard-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import { deriveStoredComplianceBadge } from "@/components/carriers/compliance-badge";
import { isOwnerRole } from "@/lib/auth/admin-role";
import { Truck, ShieldCheck, AlertTriangle, ShieldX } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Carrier Directory | FreightLink TMS",
};

// Mirrors carrier-table.tsx's complianceFilter <select> option values --
// an unrecognized ?compliance= value falls back to "ALL" rather than being
// passed through to the filter's state untouched.
const COMPLIANCE_FILTER_VALUES = new Set(["verified", "unverified", "expiring", "blocked"]);

export default async function CarriersPage({
  searchParams,
}: {
  searchParams: Promise<{ insuranceExpired?: string; compliance?: string }>;
}) {
  const { insuranceExpired, compliance } = await searchParams;
  const { data: carriers } = await listCarriers({}, { page: 1, pageSize: 100 });

  // carrier-documents is a private bucket, so coiFileUrl (an object path,
  // not a URL -- same convention as load_documents.file_url) needs signing
  // before it can be linked to, same pattern as documents/page.tsx.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const isOwner = isOwnerRole(profile?.role);

  const coiPaths = carriers.map((c) => c.coiFileUrl).filter((p): p is string => !!p);
  const coiSignedUrlByPath: Record<string, string> = {};
  if (coiPaths.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from("carrier-documents")
      .createSignedUrls(coiPaths, 3600); // 1 hour expiry
    (signedUrls ?? []).forEach((entry) => {
      if (entry.path && entry.signedUrl) {
        coiSignedUrlByPath[entry.path] = entry.signedUrl;
      }
    });
  }

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
      <CarrierTable
        carriers={carriers}
        coiSignedUrlByPath={coiSignedUrlByPath}
        initialInsuranceExpiredOnly={insuranceExpired === "1"}
        initialComplianceFilter={
          compliance && COMPLIANCE_FILTER_VALUES.has(compliance) ? compliance : undefined
        }
        isOwner={isOwner}
      />
    </div>
  );
}
