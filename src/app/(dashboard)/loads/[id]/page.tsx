import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { StatusProgressionBar } from "@/components/loads/status-progression-bar";
import { LoadFinancialBreakdown } from "@/components/loads/load-financial-breakdown";
import { LoadAuditTrail } from "@/components/loads/load-audit-trail";
import { getLoadById } from "@/lib/repositories/loads";
import { getCarrierById } from "@/lib/repositories/carriers";
import { listAuditEvents } from "@/lib/repositories/audit";
import type { LoadStop } from "../../../../../types/domain";

function StopDetails({ title, stop }: { title: string; stop: LoadStop }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{stop.facilityName ?? "—"}</span>
        <span className="text-muted-foreground">{stop.address ?? "—"}</span>
        <span className="text-muted-foreground">
          {[stop.city, stop.state, stop.zip].filter(Boolean).join(", ") || "—"}
        </span>
        <span className="text-muted-foreground">
          Window: {stop.windowStart ? new Date(stop.windowStart).toLocaleString() : "—"}
          {stop.windowEnd ? ` – ${new Date(stop.windowEnd).toLocaleString()}` : ""}
        </span>
      </CardContent>
    </Card>
  );
}

export default async function LoadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const load = await getLoadById(id);

  if (!load) {
    notFound();
  }

  const [carrier, auditEvents] = await Promise.all([
    load.carrierId ? getCarrierById(load.carrierId) : Promise.resolve(null),
    listAuditEvents("loads", load.id),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-lg font-medium">
            {load.loadNumber || load.id.slice(0, 8)}
          </h1>
          <LoadStatusBadge status={load.status} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusProgressionBar load={load} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <StopDetails title="Origin" stop={load.origin} />
        <StopDetails title="Destination" stop={load.destination} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Carrier</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            {carrier ? (
              <>
                <span className="font-medium">{carrier.name}</span>
                <span className="text-muted-foreground">
                  MC {carrier.mcNumber ?? "—"} / DOT {carrier.dotNumber ?? "—"}
                </span>
                <span className="text-muted-foreground">{carrier.contactEmail ?? "—"}</span>
                <span className="text-muted-foreground">{carrier.contactPhone ?? "—"}</span>
              </>
            ) : (
              <span className="text-muted-foreground">No carrier assigned yet.</span>
            )}
          </CardContent>
        </Card>

        <LoadFinancialBreakdown load={load} />
      </div>

      <LoadAuditTrail events={auditEvents} />
    </div>
  );
}
