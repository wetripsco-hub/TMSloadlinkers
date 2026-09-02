import Link from "next/link";

import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { formatCents } from "@/lib/money";
import type { FinancialFieldKey } from "@/lib/domain/workspace";
import type { Load } from "../../../types/domain";

const FINANCIAL_COLUMN_LABELS: Record<FinancialFieldKey, string> = {
  shipperRate: "Shipper rate",
  carrierPay: "Carrier pay",
  brokerMargin: "Broker margin",
  dispatcherCommissionEarned: "Commission",
};

interface LoadTableProps {
  loads: Load[];
  visibleFinancialFields: FinancialFieldKey[];
}

export function LoadTable({ loads, visibleFinancialFields }: LoadTableProps) {
  if (loads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No loads yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Load</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Origin</th>
            <th className="px-4 py-2 font-medium">Destination</th>
            {visibleFinancialFields.map((field) => (
              <th key={field} className="px-4 py-2 text-right font-medium">
                {FINANCIAL_COLUMN_LABELS[field]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {loads.map((load) => (
            <tr key={load.id} className="hover:bg-muted/30">
              <td className="px-4 py-2 font-medium">
                <Link href={`/loads/${load.id}`} className="hover:underline">
                  {load.loadNumber || load.id.slice(0, 8)}
                </Link>
              </td>
              <td className="px-4 py-2">
                <LoadStatusBadge status={load.status} />
              </td>
              <td className="px-4 py-2 text-muted-foreground">
                {load.origin.address || "—"}
              </td>
              <td className="px-4 py-2 text-muted-foreground">
                {load.destination.address || "—"}
              </td>
              {visibleFinancialFields.map((field) => (
                <td key={field} className="px-4 py-2 text-right tabular-nums">
                  {formatCents(load[field])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
