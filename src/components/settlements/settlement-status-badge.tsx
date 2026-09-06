import React from "react";
import { CheckCircle2, Clock, AlertTriangle, FileText, XCircle } from "lucide-react";

export type SettlementStatus =
  | "paid"
  | "PAID"
  | "ready_for_payment"
  | "READY_FOR_PAYMENT"
  | "unpaid"
  | "disputed"
  | "DISPUTED"
  | "pending_docs"
  | "PENDING_DOCS"
  | "partially_paid"
  | "void";

interface StatusStyle {
  label: string;
  badgeClass: string;
  icon: React.ReactNode;
}

const STATUS_MAP: Record<string, StatusStyle> = {
  paid: {
    label: "PAID",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  ready_for_payment: {
    label: "READY_FOR_PAYMENT",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <Clock className="h-3 w-3" />,
  },
  unpaid: {
    label: "READY_FOR_PAYMENT",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <Clock className="h-3 w-3" />,
  },
  pending_docs: {
    label: "PENDING_DOCS",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <FileText className="h-3 w-3" />,
  },
  partially_paid: {
    label: "PENDING_DOCS",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <FileText className="h-3 w-3" />,
  },
  disputed: {
    label: "DISPUTED",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  void: {
    label: "VOID",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    icon: <XCircle className="h-3 w-3" />,
  },
};

export function SettlementStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const config = STATUS_MAP[normalized] || {
    label: status.toUpperCase(),
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    icon: null,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.badgeClass}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}

export default SettlementStatusBadge;
