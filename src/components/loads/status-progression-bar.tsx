"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { advanceLoadStatus } from "@/app/(dashboard)/loads/[id]/actions";
import { LOAD_STATUS_FORWARD_CHAIN, getNextStatus } from "@/lib/domain/load-status";
import { cn } from "@/lib/utils";
import type { Load, LoadStatus } from "../../../types/domain";

const STEP_LABELS: Record<LoadStatus, string> = {
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

export function StatusProgressionBar({ load }: { load: Load }) {
  const [status, setStatus] = useState(load.status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const next = getNextStatus(status);
  const currentIndex = LOAD_STATUS_FORWARD_CHAIN.indexOf(status);

  function handleAdvance() {
    if (!next) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const updated = await advanceLoadStatus(load.id);
        setStatus(updated.status);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to advance status");
      }
    });
  }

  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2">
        <LoadStatusBadge status={status} />
        <span className="text-sm text-muted-foreground">This load has been cancelled.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {LOAD_STATUS_FORWARD_CHAIN.map((step, index) => (
          <span
            key={step}
            className={cn(
              "whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
              index < currentIndex && "bg-muted text-muted-foreground",
              index === currentIndex && "bg-primary text-primary-foreground",
              index > currentIndex && "bg-muted/40 text-muted-foreground/60"
            )}
          >
            {STEP_LABELS[step]}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" size="sm" disabled={!next || isPending} onClick={handleAdvance}>
          {isPending
            ? "Advancing..."
            : next
              ? `Advance to ${STEP_LABELS[next]}`
              : "No further status"}
        </Button>
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </div>
  );
}
