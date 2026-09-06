import { cn } from "@/lib/utils";
import type { LoadStatus } from "../../../types/domain";

export const STATUS_LABELS: Record<LoadStatus, string> = {
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

const STATUS_COLORS: Record<LoadStatus, string> = {
  quoted: "bg-slate-50 text-slate-700 border border-slate-200",
  posted_to_boards: "bg-blue-50 text-blue-700 border border-blue-200",
  covered: "bg-blue-50 text-blue-700 border border-blue-200",
  dispatched: "bg-blue-50 text-blue-700 border border-blue-200",
  at_pickup: "bg-amber-50 text-amber-700 border border-amber-200",
  in_transit: "bg-amber-50 text-amber-700 border border-amber-200",
  at_delivery: "bg-amber-50 text-amber-700 border border-amber-200",
  delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  pod_uploaded: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  invoiced: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  settled: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border border-rose-200",
};

export function LoadStatusBadge({ status }: { status: LoadStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_COLORS[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export const LOAD_STATUS_ORDER: LoadStatus[] = [
  "quoted",
  "posted_to_boards",
  "covered",
  "dispatched",
  "at_pickup",
  "in_transit",
  "at_delivery",
  "delivered",
  "pod_uploaded",
  "invoiced",
  "settled",
  "cancelled",
];
