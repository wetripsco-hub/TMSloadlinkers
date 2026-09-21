import type { QuoteStatus } from "../../../types/domain";

// Shared between components/loads/quote-panel.tsx (load detail) and
// app/(dashboard)/quotes (org-wide list) so the two views of the same
// quote never drift into different labels/colors for the same status.
export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  sent: "Sent — awaiting shipper",
  countered_by_shipper: "Shipper countered",
  countered_by_broker: "You countered — awaiting shipper",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  cancelled: "Cancelled",
};

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  countered_by_shipper: "bg-amber-50 text-amber-700 border-amber-200",
  countered_by_broker: "bg-blue-50 text-blue-700 border-blue-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  declined: "bg-rose-50 text-rose-700 border-rose-200",
  expired: "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};
