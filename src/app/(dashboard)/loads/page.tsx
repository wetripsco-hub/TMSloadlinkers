import type { Metadata } from "next";
import { listLoads } from "@/lib/repositories/loads";
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
  searchParams: Promise<{ status?: string }>;
}) {
  const [loadsResult, customersResult, carriersResult, organization, { status }] = await Promise.all([
    listLoads({}, { page: 1, pageSize: 100 }),
    listCustomers({}, { page: 1, pageSize: 100 }),
    listCarriers({}, { page: 1, pageSize: 100 }),
    getCurrentUserOrganization(),
    searchParams,
  ]);

  return (
    <LoadsView
      loads={loadsResult.data}
      customers={customersResult.data}
      carriers={carriersResult.data}
      organization={organization}
      initialStatus={status}
    />
  );
}
