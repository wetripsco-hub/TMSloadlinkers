"use client";

import { useState, useTransition } from "react";

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
        <span className="text-sm text-slate-500">This load has been cancelled.</span>
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
              "whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              index < currentIndex && "bg-emerald-50 text-emerald-700 border border-emerald-200",
              index === currentIndex && "bg-blue-600 text-white font-semibold shadow-xs",
              index > currentIndex && "bg-slate-50 text-slate-400 border border-slate-200/70"
            )}
          >
            {STEP_LABELS[step]}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          disabled={!next || isPending}
          onClick={handleAdvance}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          {isPending
            ? "Advancing..."
            : next
              ? `Advance to ${STEP_LABELS[next]}`
              : "Completed Lifecycle"}
        </button>
        {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
      </div>
    </div>
  );
}
