import { listInvoices } from "@/lib/repositories/invoices";
import { listLoads, getLoadById } from "@/lib/repositories/loads";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { GenerateInvoiceDialog } from "@/components/invoices/generate-invoice-dialog";
import type { Load } from "../../../../types/domain";

export default async function InvoicesPage() {
  const [{ data: invoices }, deliveredLoads, podUploadedLoads] = await Promise.all([
    listInvoices({}, { page: 1, pageSize: 50 }),
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

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-lg font-medium">Invoices</h1>
        <GenerateInvoiceDialog eligibleLoads={eligibleLoads} />
      </div>

      <InvoiceTable invoices={invoices} loadsById={loadsById} />
    </div>
  );
}
