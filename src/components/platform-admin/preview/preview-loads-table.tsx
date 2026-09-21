import { formatMoney, formatDate } from "@/lib/format";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/tailadmin/table";
import { Package } from "lucide-react";
import type { Load } from "../../../../types/domain";

// Deliberately not the interactive LoadTable (loads/load-table.tsx): this
// renders inside a platform-admin org preview, which must have no action
// buttons or forms wired to submit. Display only.
export function PreviewLoadsTable({ loads }: { loads: Load[] }) {
  if (loads.length === 0) {
    return <EmptyState icon={Package} title="No loads" description="This organization has no loads yet." />;
  }

  return (
    <Table>
      <TableHeader>
        <tr>
          <TableCell isHeader>Load #</TableCell>
          <TableCell isHeader>Status</TableCell>
          <TableCell isHeader>Origin</TableCell>
          <TableCell isHeader>Destination</TableCell>
          <TableCell isHeader>Shipper rate</TableCell>
          <TableCell isHeader>Margin</TableCell>
          <TableCell isHeader>Created</TableCell>
        </tr>
      </TableHeader>
      <TableBody>
        {loads.map((load) => (
          <TableRow key={load.id}>
            <TableCell>
              <span className="font-medium text-slate-900">{load.loadNumber || load.id.slice(0, 8)}</span>
            </TableCell>
            <TableCell>
              <LoadStatusBadge status={load.status} />
            </TableCell>
            <TableCell>{load.origin?.address || "—"}</TableCell>
            <TableCell>{load.destination?.address || "—"}</TableCell>
            <TableCell>{formatMoney(load.shipperRate)}</TableCell>
            <TableCell>{formatMoney(load.brokerMargin)}</TableCell>
            <TableCell>{formatDate(load.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
