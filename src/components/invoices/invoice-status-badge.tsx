import { cn } from "@/lib/utils";
import type { PaymentStatus } from "../../../types/domain";

const STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partially_paid: "Partially paid",
  paid: "Paid",
  factored: "Factored",
  void: "Void",
};

const STATUS_COLORS: Record<PaymentStatus, string> = {
  unpaid: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  partially_paid: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  factored: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  void: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
};

export function InvoiceStatusBadge({ status }: { status: PaymentStatus }) {
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
