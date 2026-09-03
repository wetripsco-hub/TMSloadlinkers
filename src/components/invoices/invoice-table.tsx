import Link from "next/link";

import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { formatCents } from "@/lib/money";
import type { Invoice, Load } from "../../../types/domain";

const INVOICE_TYPE_LABELS: Record<Invoice["invoiceType"], string> = {
  shipper_invoice: "Shipper invoice",
  carrier_settlement_voucher: "Carrier settlement",
  dispatcher_carrier_commission: "Dispatcher commission",
};

interface InvoiceTableProps {
  invoices: Invoice[];
  loadsById: Record<string, Load>;
}

export function InvoiceTable({ invoices, loadsById }: InvoiceTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No invoices yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Invoice</th>
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Load</th>
            <th className="px-4 py-2 text-right font-medium">Total</th>
            <th className="px-4 py-2 text-right font-medium">Paid</th>
            <th className="px-4 py-2 text-right font-medium">Due</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {invoices.map((invoice) => {
            const load = invoice.loadId ? loadsById[invoice.loadId] : undefined;

            return (
              <tr key={invoice.id} className="hover:bg-muted/30">
                <td className="px-4 py-2 font-medium">
                  {invoice.invoiceNumber || invoice.id.slice(0, 8)}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {INVOICE_TYPE_LABELS[invoice.invoiceType]}
                </td>
                <td className="px-4 py-2">
                  <InvoiceStatusBadge status={invoice.status} />
                </td>
                <td className="px-4 py-2">
                  {invoice.loadId ? (
                    <Link href={`/loads/${invoice.loadId}`} className="hover:underline">
                      {load?.loadNumber || invoice.loadId.slice(0, 8)}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {formatCents(invoice.amountTotal)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {formatCents(invoice.amountPaid)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {formatCents(invoice.amountDue)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
