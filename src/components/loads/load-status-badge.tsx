import { cn } from "@/lib/utils";
import type { LoadStatus } from "../../../types/domain";

const STATUS_LABELS: Record<LoadStatus, string> = {
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
  quoted: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  posted_to_boards: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  covered: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  dispatched: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  at_pickup: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  in_transit: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  at_delivery: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  delivered: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  pod_uploaded: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  invoiced: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  settled: "bg-green-200 text-green-800 dark:bg-green-500/30 dark:text-green-200",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
};

export function LoadStatusBadge({ status }: { status: LoadStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
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
