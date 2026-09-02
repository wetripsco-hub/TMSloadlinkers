import Link from "next/link";

import { LoadStatusBadge, LOAD_STATUS_ORDER } from "@/components/loads/load-status-badge";
import { formatCents } from "@/lib/money";
import type { FinancialFieldKey } from "@/lib/domain/workspace";
import type { Load, LoadStatus } from "../../../types/domain";

const STATUS_COLUMN_LABELS: Record<LoadStatus, string> = {
  quoted: "Quoted",
  posted_to_boards: "Posted",
  covered: "Covered",
  dispatched: "Dispatched",
  at_pickup: "At pickup",
  in_transit: "In transit",
  at_delivery: "At delivery",
  delivered: "Delivered",
  pod_uploaded: "POD uploaded",
  invoiced: "Invoiced",
  settled: "Settled",
  cancelled: "Cancelled",
};

interface LoadKanbanProps {
  loads: Load[];
  visibleFinancialFields: FinancialFieldKey[];
}

export function LoadKanban({ loads, visibleFinancialFields }: LoadKanbanProps) {
  const loadsByStatus = new Map<LoadStatus, Load[]>();
  for (const status of LOAD_STATUS_ORDER) {
    loadsByStatus.set(status, []);
  }
  for (const load of loads) {
    loadsByStatus.get(load.status)?.push(load);
  }

  const primaryField = visibleFinancialFields[0];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {LOAD_STATUS_ORDER.map((status) => {
        const columnLoads = loadsByStatus.get(status) ?? [];
        return (
          <div key={status} className="flex w-64 shrink-0 flex-col gap-2 rounded-lg bg-muted/30 p-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium text-muted-foreground">
                {STATUS_COLUMN_LABELS[status]}
              </span>
              <span className="text-xs text-muted-foreground">{columnLoads.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {columnLoads.map((load) => (
                <Link
                  key={load.id}
                  href={`/loads/${load.id}`}
                  className="flex flex-col gap-1.5 rounded-lg bg-card p-3 text-sm ring-1 ring-foreground/10 hover:ring-foreground/20"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{load.loadNumber || load.id.slice(0, 8)}</span>
                    <LoadStatusBadge status={load.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {load.origin.address || "—"} &rarr; {load.destination.address || "—"}
                  </div>
                  {primaryField && (
                    <div className="text-sm font-medium tabular-nums">
                      {formatCents(load[primaryField])}
                    </div>
                  )}
                </Link>
              ))}
              {columnLoads.length === 0 && (
                <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                  Empty
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
