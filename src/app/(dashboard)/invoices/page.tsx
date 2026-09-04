import { listInvoices } from "@/lib/repositories/invoices";
import { listLoads, getLoadById } from "@/lib/repositories/loads";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { GenerateInvoiceDialog } from "@/components/invoices/generate-invoice-dialog";
import { PageBreadcrumb } from "@/components/common/PageBreadCrumb";
import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import { formatCents } from "@/lib/money";
import { Receipt, DollarSign, CheckCircle2, Clock } from "lucide-react";
import type { Load } from "../../../../types/domain";

export const dynamic = "force-dynamic";

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
      {/* Breadcrumb Header with Generate Invoice action */}
      <PageBreadcrumb pageTitle="Invoices & Receivables">
        <GenerateInvoiceDialog eligibleLoads={eligibleLoads} />
      </PageBreadcrumb>

      {/* KPI Ribbon Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Invoiced"
          value={formatCents(totalInvoicedCents)}
          icon={<Receipt className="h-6 w-6 text-brand-500" />}
          badgeText="All Time"
          badgeColor="primary"
          subtitle={`${invoices.length} invoices generated`}
        />

        <MetricCard
          title="Collected / Paid"
          value={formatCents(totalPaidCents)}
          icon={<CheckCircle2 className="h-6 w-6 text-emerald-500" />}
          badgeText="Deposited"
          badgeColor="success"
          subtitle="Reconciled revenue"
        />

        <MetricCard
          title="Outstanding Due"
          value={formatCents(totalDueCents)}
          icon={<Clock className="h-6 w-6 text-amber-500" />}
          badgeText={pendingCount > 0 ? `${pendingCount} Open` : "All Clear"}
          badgeColor={pendingCount > 0 ? "warning" : "light"}
          subtitle="Pending shipper payment"
        />

        <MetricCard
          title="Eligible Loads to Bill"
          value={eligibleLoads.length}
          icon={<DollarSign className="h-6 w-6 text-sky-500" />}
          badgeText={eligibleLoads.length > 0 ? "Ready to Bill" : "None"}
          badgeColor="info"
          subtitle="Delivered or POD uploaded loads"
        />
      </div>

      {/* Main Invoices Table */}
      <InvoiceTable invoices={invoices} loadsById={loadsById} />
    </div>
  );
}
