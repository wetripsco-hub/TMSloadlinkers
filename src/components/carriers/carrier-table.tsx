import { ComplianceStatusBadge, deriveStoredComplianceBadge } from "@/components/carriers/compliance-badge";
import type { CarrierRecord } from "@/lib/repositories/carriers";

export function CarrierTable({ carriers }: { carriers: CarrierRecord[] }) {
  if (carriers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No carriers yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Company</th>
            <th className="px-4 py-2 font-medium">MC / DOT</th>
            <th className="px-4 py-2 font-medium">Contact</th>
            <th className="px-4 py-2 font-medium">Compliance</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {carriers.map((carrier) => (
            <tr key={carrier.id} className="hover:bg-muted/30">
              <td className="px-4 py-2 font-medium">{carrier.companyName}</td>
              <td className="px-4 py-2 text-muted-foreground">
                MC {carrier.mcNumber || "—"} / DOT {carrier.dotNumber || "—"}
              </td>
              <td className="px-4 py-2 text-muted-foreground">
                <div className="flex flex-col">
                  <span>{carrier.contactEmail ?? "—"}</span>
                  <span>{carrier.contactPhone ?? "—"}</span>
                </div>
              </td>
              <td className="px-4 py-2">
                <ComplianceStatusBadge badge={deriveStoredComplianceBadge(carrier)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
