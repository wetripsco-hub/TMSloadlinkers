import { notFound } from "next/navigation";

import { RateConfirmationView } from "@/components/documents/rate-confirmation-view";
import { PrintButton } from "@/components/documents/print-button";
import { getLoadById } from "@/lib/repositories/loads";
import { getCarrierById } from "@/lib/repositories/carriers";
import { getOrganizationById } from "@/lib/repositories/organizations";

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

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
      <div className="no-print flex items-center justify-between">
        <h1 className="font-heading text-lg font-medium">
          Rate Confirmation · {load.loadNumber || load.id.slice(0, 8)}
        </h1>
        <PrintButton />
      </div>

      <RateConfirmationView load={load} carrier={carrier} organization={organization} />
    </div>
  );
}
