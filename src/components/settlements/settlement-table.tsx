import Link from "next/link";

import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { formatCents } from "@/lib/money";
import type { Invoice, Load } from "../../../types/domain";
import type { CarrierRecord } from "@/lib/repositories/carriers";

interface SettlementTableProps {
  settlements: Invoice[];
  loadsById: Record<string, Load>;
  carriersById: Record<string, CarrierRecord>;
}

export function SettlementTable({ settlements, loadsById, carriersById }: SettlementTableProps) {
  if (settlements.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No settlement vouchers yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Voucher</th>
            <th className="px-4 py-2 font-medium">Load</th>
            <th className="px-4 py-2 font-medium">Carrier</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 text-right font-medium">Amount paid</th>
            <th className="px-4 py-2 font-medium">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {settlements.map((invoice) => {
            const load = invoice.loadId ? loadsById[invoice.loadId] : undefined;
            const carrier = load?.carrierId ? carriersById[load.carrierId] : undefined;

            return (
              <tr key={invoice.id} className="hover:bg-muted/30">
                <td className="px-4 py-2 font-medium">
                  {invoice.invoiceNumber || invoice.id.slice(0, 8)}
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
                <td className="px-4 py-2 text-muted-foreground">
                  {carrier?.companyName || "—"}
                </td>
                <td className="px-4 py-2">
                  <InvoiceStatusBadge status={invoice.status} />
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {formatCents(invoice.amountTotal)}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(invoice.issueDate).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
