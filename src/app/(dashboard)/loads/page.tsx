import { listLoads } from "@/lib/repositories/loads";
import { listCustomers } from "@/lib/repositories/customers";
import { listCarriers } from "@/lib/repositories/carriers";
import { LoadsView } from "@/components/loads/loads-view";

export const dynamic = "force-dynamic";

export default async function LoadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [loadsResult, customersResult, carriersResult, { status }] = await Promise.all([
    listLoads({}, { page: 1, pageSize: 100 }),
    listCustomers({}, { page: 1, pageSize: 100 }),
    listCarriers({}, { page: 1, pageSize: 100 }),
    searchParams,
  ]);

  return (
    <LoadsView
      loads={loadsResult.data}
      customers={customersResult.data}
      carriers={carriersResult.data}
      initialStatus={status}
    />
  );
}
