import { listCarriers } from "@/lib/repositories/carriers";
import { CarrierTable } from "@/components/carriers/carrier-table";
import { CarrierOnboardDialog } from "@/components/carriers/carrier-onboard-dialog";

export default async function CarriersPage() {
  const { data: carriers } = await listCarriers({}, { page: 1, pageSize: 50 });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-lg font-medium">Carriers</h1>
        <CarrierOnboardDialog />
      </div>
      <CarrierTable carriers={carriers} />
    </div>
  );
}
