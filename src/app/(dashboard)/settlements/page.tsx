import type { Metadata } from "next";
import { listInvoices } from "@/lib/repositories/invoices";
import { listLoads, getLoadById } from "@/lib/repositories/loads";
import { getCarrierById } from "@/lib/repositories/carriers";
import { getCurrentUserOrganization } from "@/lib/repositories/organizations";
import { SettlementTable } from "@/components/settlements/settlement-table";
import { GenerateSettlementDialog } from "@/components/settlements/generate-settlement-dialog";
import { ExportCsvButton } from "@/components/settlements/export-csv-button";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import { formatMoney } from "@/lib/format";
import { Landmark, CheckCircle2, Clock, Truck } from "lucide-react";
import type { Load } from "../../../../types/domain";
import type { CarrierRecord } from "@/lib/repositories/carriers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Carrier Settlements (AP) | Freight Operations",
};

export default async function SettlementsPage() {
  const [{ data: invoices }, deliveredLoads, podUploadedLoads, organization] = await Promise.all([
    listInvoices({}, { page: 1, pageSize: 100 }),
    listLoads({ status: "delivered" }, { page: 1, pageSize: 50 }),
    listLoads({ status: "pod_uploaded" }, { page: 1, pageSize: 50 }),
    getCurrentUserOrganization(),
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

  // Calculate voucher totals
  let totalDisbursedCents = 0;
  let totalPendingCents = 0;
  let paidVouchersCount = 0;

  settlements.forEach((s) => {
    if (s.status === "paid") {
      totalDisbursedCents += s.amountTotal || 0;
      paidVouchersCount++;
    } else {
      totalPendingCents += s.amountTotal || 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Standardized Page Header with Actions */}
      <PageHeader
        title="Carrier Settlements (Payables)"
        subtitle="Audit completed trips, process carrier remittances, and generate ACH batch payouts."
        breadcrumbs={[
          { label: "Financials", href: "/settlements" },
          { label: "Settlements", href: "/settlements" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <ExportCsvButton />
            <GenerateSettlementDialog eligibleLoads={eligibleLoads} />
          </div>
        }
      />

      {/* KPI Ribbon Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Disbursed Pay"
          value={formatMoney(totalDisbursedCents)}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          badgeText="Paid"
          badgeColor="success"
          subtitle={`${paidVouchersCount} vouchers completed`}
          variant="plausible"
        />

        <MetricCard
          title="Pending Carrier Pay"
          value={formatMoney(totalPendingCents)}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          badgeText={totalPendingCents > 0 ? "Payable" : "0"}
          badgeColor={totalPendingCents > 0 ? "warning" : "light"}
          subtitle="Awaiting ACH / QuickPay release"
          variant="plausible"
        />

        <MetricCard
          title="Eligible Loads to Settle"
          value={eligibleLoads.length}
          icon={<Truck className="h-5 w-5 text-blue-600" />}
          badgeText={eligibleLoads.length > 0 ? "Ready" : "None"}
          badgeColor="primary"
          subtitle="Delivered with assigned carriers"
          variant="plausible"
        />

        <MetricCard
          title="Total Vouchers"
          value={settlements.length}
          icon={<Landmark className="h-5 w-5 text-sky-600" />}
          badgeText="All Time"
          badgeColor="info"
          subtitle="Carrier pay settlement history"
          variant="plausible"
        />
      </div>

      {/* Settlement Table */}
      <SettlementTable
        settlements={settlements}
        loadsById={loadsById}
        carriersById={carriersById}
        organization={organization}
      />
    </div>
  );
}
