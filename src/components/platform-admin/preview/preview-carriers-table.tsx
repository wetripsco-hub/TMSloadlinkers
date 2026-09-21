import { ComplianceStatusBadge, deriveStoredComplianceBadge } from "@/components/carriers/compliance-badge";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/tailadmin/table";
import { Truck } from "lucide-react";
import type { CarrierRecord } from "@/lib/repositories/carriers";

// Deliberately not the interactive CarrierTable (carriers/carrier-table.tsx),
// which wires an onboard-carrier dialog: this renders inside a platform-admin
// org preview, which must have no action buttons or forms wired to submit.
export function PreviewCarriersTable({ carriers }: { carriers: CarrierRecord[] }) {
  if (carriers.length === 0) {
    return <EmptyState icon={Truck} title="No carriers" description="This organization has no carriers yet." />;
  }

  return (
    <Table>
      <TableHeader>
        <tr>
          <TableCell isHeader>Carrier</TableCell>
          <TableCell isHeader>MC / DOT</TableCell>
          <TableCell isHeader>Compliance</TableCell>
          <TableCell isHeader>Insurance expires</TableCell>
          <TableCell isHeader>Onboarded</TableCell>
        </tr>
      </TableHeader>
      <TableBody>
        {carriers.map((carrier) => (
          <TableRow key={carrier.id}>
            <TableCell>
              <span className="font-medium text-slate-900">{carrier.companyName}</span>
            </TableCell>
            <TableCell>
              {carrier.mcNumber || "—"} / {carrier.dotNumber || "—"}
            </TableCell>
            <TableCell>
              <ComplianceStatusBadge badge={deriveStoredComplianceBadge(carrier)} />
            </TableCell>
            <TableCell>{formatDate(carrier.insuranceExpiryDate)}</TableCell>
            <TableCell>{formatDate(carrier.lastVerifiedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
