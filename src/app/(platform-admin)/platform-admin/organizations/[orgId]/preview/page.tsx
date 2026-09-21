import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { startOrgPreview } from "@/app/actions/platform-admin";
import {
  getPreviewOrganization,
  getPreviewLoads,
  getPreviewCarriers,
} from "@/lib/repositories/platform-admin-preview";
import { PageHeader } from "@/components/layout/page-header";
import { OrgPreviewBanner } from "@/components/platform-admin/preview/org-preview-banner";
import { PreviewLoadsTable } from "@/components/platform-admin/preview/preview-loads-table";
import { PreviewCarriersTable } from "@/components/platform-admin/preview/preview-carriers-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Organization Preview | FreightLink Console",
};

export default async function PlatformAdminOrgPreviewPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  await requirePlatformAdmin();

  const { orgId } = await params;

  const organization = await getPreviewOrganization(orgId);
  if (!organization) {
    notFound();
  }

  const [logId, loads, carriers] = await Promise.all([
    startOrgPreview(orgId),
    getPreviewLoads(orgId),
    getPreviewCarriers(orgId),
  ]);

  return (
    <div className="space-y-6">
      <OrgPreviewBanner orgName={organization.name} logId={logId} />

      <PageHeader
        title={`${organization.name} (read-only preview)`}
        subtitle="Cross-tenant preview session. No changes made here are saved to this organization."
        breadcrumbs={[
          { label: "Platform Admin", href: "/platform-admin" },
          { label: "Organizations", href: "/platform-admin/organizations" },
          { label: organization.name },
        ]}
      />

      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 tracking-tight">Loads</h3>
        <PreviewLoadsTable loads={loads} />
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 tracking-tight">Carriers</h3>
        <PreviewCarriersTable carriers={carriers} />
      </div>
    </div>
  );
}
