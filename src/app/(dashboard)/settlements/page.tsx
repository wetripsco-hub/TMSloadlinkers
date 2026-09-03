import { listInvoices } from "@/lib/repositories/invoices";
import { listLoads, getLoadById } from "@/lib/repositories/loads";
import { getCarrierById } from "@/lib/repositories/carriers";
import { SettlementTable } from "@/components/settlements/settlement-table";
import { GenerateSettlementDialog } from "@/components/settlements/generate-settlement-dialog";
import { ExportCsvButton } from "@/components/settlements/export-csv-button";
import type { Load } from "../../../../types/domain";
import type { CarrierRecord } from "@/lib/repositories/carriers";

export default async function SettlementsPage() {
  const [{ data: invoices }, deliveredLoads, podUploadedLoads] = await Promise.all([
    listInvoices({}, { page: 1, pageSize: 50 }),
    listLoads({ status: "delivered" }, { page: 1, pageSize: 50 }),
    listLoads({ status: "pod_uploaded" }, { page: 1, pageSize: 50 }),
  ]);

  const settlements = invoices.filter(
    (invoice) => invoice.invoiceType === "carrier_settlement_voucher"
  );
  const eligibleLoads = [...deliveredLoads.data, ...podUploadedLoads.data].filter(
    (load) => load.carrierId
  );

  const settlementLoadIds = Array.from(
    new Set(settlements.map((invoice) => invoice.loadId).filter((id): id is string => !!id))
  );
  const loadedSettlementLoads = await Promise.all(settlementLoadIds.map((id) => getLoadById(id)));

  const loadsById: Record<string, Load> = {};
  for (const load of [...eligibleLoads, ...loadedSettlementLoads]) {
    if (load) loadsById[load.id] = load;
  }

  const carrierIds = Array.from(
    new Set(
      Object.values(loadsById)
        .map((load) => load.carrierId)
        .filter((id): id is string => !!id)
    )
  );
  const loadedCarriers = await Promise.all(carrierIds.map((id) => getCarrierById(id)));
  const carriersById: Record<string, CarrierRecord> = {};
  for (const carrier of loadedCarriers) {
    if (carrier) carriersById[carrier.id] = carrier;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-lg font-medium">Carrier settlements</h1>
        <div className="flex items-center gap-2">
          <ExportCsvButton />
          <GenerateSettlementDialog eligibleLoads={eligibleLoads} />
        </div>
      </div>

      <SettlementTable settlements={settlements} loadsById={loadsById} carriersById={carriersById} />
    </div>
  );
}
