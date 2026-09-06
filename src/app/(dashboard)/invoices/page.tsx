import type { Metadata } from "next";
import { listInvoices } from "@/lib/repositories/invoices";
import { listLoads, getLoadById } from "@/lib/repositories/loads";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { GenerateInvoiceDialog } from "@/components/invoices/generate-invoice-dialog";
import { SyncQuickBooksButton } from "@/components/invoices/sync-quickbooks-button";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import { formatMoney } from "@/lib/format";
import { Receipt, DollarSign, CheckCircle2, Clock } from "lucide-react";
import type { Load } from "../../../../types/domain";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invoices (AR) | FreightLink TMS",
};

export default async function InvoicesPage() {
  const [{ data: invoices }, deliveredLoads, podUploadedLoads] = await Promise.all([
    listInvoices({}, { page: 1, pageSize: 100 }),
    listLoads({ status: "delivered" }, { page: 1, pageSize: 50 }),
    listLoads({ status: "pod_uploaded" }, { page: 1, pageSize: 50 }),
  ]);

  const eligibleLoads = [...deliveredLoads.data, ...podUploadedLoads.data];

  const invoiceLoadIds = Array.from(
    new Set(invoices.map((invoice) => invoice.loadId).filter((id): id is string => !!id))
  );
  const loadedInvoiceLoads = await Promise.all(invoiceLoadIds.map((id) => getLoadById(id)));

  const loadsById: Record<string, Load> = {};
  for (const load of [...eligibleLoads, ...loadedInvoiceLoads]) {
    if (load) loadsById[load.id] = load;
  }

  // Calculate financial KPI totals in cents
  let totalInvoicedCents = 0;
  let totalPaidCents = 0;
  let totalDueCents = 0;
  let pendingCount = 0;

  invoices.forEach((inv) => {
    totalInvoicedCents += inv.amountTotal || 0;
    totalPaidCents += inv.amountPaid || 0;
    totalDueCents += inv.amountDue || 0;
    if (inv.status === "unpaid" || inv.status === "partially_paid") {
      pendingCount++;
    }
  });

  return (
    <div className="space-y-6">
      {/* Standardized Page Header with Actions */}
      <PageHeader
        title="Invoices (Accounts Receivable)"
        subtitle="Generate customer billing, track outstanding AR, and synchronize ledger data."
        breadcrumbs={[
          { label: "Financials", href: "/invoices" },
          { label: "Invoices", href: "/invoices" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <SyncQuickBooksButton />
            <GenerateInvoiceDialog eligibleLoads={eligibleLoads} />
          </div>
        }
      />

      {/* KPI Ribbon Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Invoiced"
          value={formatMoney(totalInvoicedCents)}
          icon={<Receipt className="h-5 w-5 text-blue-600" />}
          badgeText="All Time"
          badgeColor="primary"
          subtitle={`${invoices.length} invoices generated`}
          variant="plausible"
        />

        <MetricCard
          title="Collected / Paid"
          value={formatMoney(totalPaidCents)}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          badgeText="Deposited"
          badgeColor="success"
          subtitle="Reconciled revenue"
          variant="plausible"
        />

        <MetricCard
          title="Outstanding Due"
          value={formatMoney(totalDueCents)}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          badgeText={pendingCount > 0 ? `${pendingCount} Open` : "All Clear"}
          badgeColor={pendingCount > 0 ? "warning" : "light"}
          subtitle="Pending shipper payment"
          variant="plausible"
        />

        <MetricCard
          title="Eligible Loads to Bill"
          value={eligibleLoads.length}
          icon={<DollarSign className="h-5 w-5 text-sky-600" />}
          badgeText={eligibleLoads.length > 0 ? "Ready to Bill" : "None"}
          badgeColor="info"
          subtitle="Delivered or POD uploaded loads"
          variant="plausible"
        />
      </div>

      {/* Main Invoices Table */}
      <InvoiceTable invoices={invoices} loadsById={loadsById} />
    </div>
  );
}
