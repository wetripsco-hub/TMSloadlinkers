import { notFound } from "next/navigation";
import Link from "next/link";
import { RateConfirmationView } from "@/components/documents/rate-confirmation-view";
import { PrintButton } from "@/components/documents/print-button";
import { PageHeader } from "@/components/layout/page-header";
import { getLoadById } from "@/lib/repositories/loads";
import { getCarrierById } from "@/lib/repositories/carriers";
import { getOrganizationById } from "@/lib/repositories/organizations";
import { ArrowLeft } from "lucide-react";

export default async function RateConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const load = await getLoadById(id);

  if (!load) {
    notFound();
  }

  const [carrier, organization] = await Promise.all([
    load.carrierId ? getCarrierById(load.carrierId) : Promise.resolve(null),
    getOrganizationById(load.orgId),
  ]);

  const loadLabel = load.loadNumber || `LD-${load.id.slice(0, 6).toUpperCase()}`;

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          title={`Rate Confirmation · ${loadLabel}`}
          subtitle="Official broker-carrier rate agreement and dispatch sheet."
          breadcrumbs={[
            { label: "Operations", href: "/overview" },
            { label: "Loads", href: "/loads" },
            { label: loadLabel, href: `/loads/${load.id}` },
            { label: "Rate Confirmation" },
          ]}
          action={
            <div className="flex items-center gap-2">
              <Link
                href={`/loads/${load.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Load
              </Link>
              <PrintButton />
            </div>
          }
        />
      </div>

      <RateConfirmationView load={load} carrier={carrier} organization={organization} />
    </div>
  );
}
