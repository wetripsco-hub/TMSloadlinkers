import type { Metadata } from "next";
import { listLoads, getLoadIdsWithCompletedPod } from "@/lib/repositories/loads";
import { getLoadIdsWithUnreadDriverNotes } from "@/lib/repositories/load-notes";
import { listCustomers } from "@/lib/repositories/customers";
import { listCarriers } from "@/lib/repositories/carriers";
import { getCurrentUserOrganization } from "@/lib/repositories/organizations";
import { LoadsView } from "@/components/loads/loads-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Loads | FreightLink TMS",
};

export default async function LoadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; noCarrier?: string; pendingPod?: string }>;
}) {
  const [
    loadsResult,
    customersResult,
    carriersResult,
    organization,
    completedPodLoadIds,
    unreadNoteLoadIds,
    { status, noCarrier, pendingPod },
  ] = await Promise.all([
    listLoads({}, { page: 1, pageSize: 100 }),
    listCustomers({}, { page: 1, pageSize: 100 }),
    listCarriers({}, { page: 1, pageSize: 100 }),
    getCurrentUserOrganization(),
    getLoadIdsWithCompletedPod(),
    getLoadIdsWithUnreadDriverNotes(),
    searchParams,
  ]);

  return (
    <LoadsView
      loads={loadsResult.data}
      customers={customersResult.data}
      carriers={carriersResult.data}
      organization={organization}
      initialStatus={status}
      initialNoCarrier={noCarrier === "1"}
      initialPendingPod={pendingPod === "1"}
      completedPodLoadIds={completedPodLoadIds}
      unreadNoteLoadIds={unreadNoteLoadIds}
    />
  );
}
