import React from "react";
import { Badge, type BadgeColor } from "@/components/ui/tailadmin/badge";
import { CheckCircle2, Clock, AlertCircle, RefreshCw, XCircle } from "lucide-react";
import type { PaymentStatus } from "../../../types/domain";

const BADGE_CONFIG: Record<
  PaymentStatus,
  { label: string; color: BadgeColor; icon: React.ReactNode }
> = {
  paid: {
    label: "Paid",
    color: "success",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  unpaid: {
    label: "Unpaid / Due",
    color: "warning",
    icon: <Clock className="h-3 w-3" />,
  },
  partially_paid: {
    label: "Partial",
    color: "info",
    icon: <RefreshCw className="h-3 w-3" />,
  },
  factored: {
    label: "Factored",
    color: "primary",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  void: {
    label: "Void",
    color: "error",
    icon: <XCircle className="h-3 w-3" />,
  },
};

export function InvoiceStatusBadge({ status }: { status: PaymentStatus }) {
  const config = BADGE_CONFIG[status] || BADGE_CONFIG.unpaid;

  return (
    <Badge color={config.color} size="sm" startIcon={config.icon}>
      {config.label}
    </Badge>
  );
}
