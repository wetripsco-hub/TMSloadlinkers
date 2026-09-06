import type { UUID } from "../../../types/domain";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MAX_RANGE_DAYS = 366;
const DEFAULT_NEEDS_ATTENTION_THRESHOLD = 85;

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export interface DateRangeValidation {
  valid: boolean;
  error?: string;
}

// "YYYY-MM-DD" is parsed as UTC midnight per the ISO-8601 date-only grammar
// (ECMA-262 21.4.3.2), so this stays immune to the caller's local timezone.
function toUtcDateOnlyMs(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00.000Z`).getTime();
}

export function validateReportDateRange(
  startDate: string,
  endDate: string,
  today: Date = new Date()
): DateRangeValidation {
  const start = toUtcDateOnlyMs(startDate);
  const end = toUtcDateOnlyMs(endDate);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return { valid: false, error: "Enter valid start and end dates" };
  }

  if (start > end) {
    return { valid: false, error: "Start date must be on or before end date" };
  }

  const rangeDays = Math.round((end - start) / MS_PER_DAY) + 1;
  if (rangeDays > MAX_RANGE_DAYS) {
    return { valid: false, error: `Date range cannot exceed ${MAX_RANGE_DAYS} days` };
  }

  const todayUtc = toUtcDateOnlyMs(today.toISOString().slice(0, 10));
  if (end > todayUtc) {
    return { valid: false, error: "End date cannot be in the future" };
  }

  return { valid: true };
}

export interface OnTimePctDisplay {
  text: string;
  hint: string;
  hasData: boolean;
}

// onTimePct is null whenever get_on_time_delivery_pct/get_carrier_performance_report
// find zero eligible loads (no audit trail, or a null committed delivery_date --
// see 034_on_time_delivery_and_carrier_performance.sql). Rendering that as "0%"
// would misrepresent absence of data as a real zero score, the same category of
// mistake as the earlier shipper_rate = 0 bug (027/028/029) -- so null always
// renders as "No data", never a percentage.
export function formatOnTimePct(
  onTimePct: number | null,
  excludedCount: number,
  totalEligible: number
): OnTimePctDisplay {
  if (onTimePct === null) {
    const hint =
      excludedCount > 0
        ? `${excludedCount} load${excludedCount === 1 ? "" : "s"} excluded — no audit trail`
        : "No delivered loads in range";
    return { text: "No data", hint, hasData: false };
  }

  const hint =
    excludedCount > 0
      ? `Based on ${totalEligible} eligible load${totalEligible === 1 ? "" : "s"}; ${excludedCount} excluded — no audit trail`
      : `Based on ${totalEligible} eligible load${totalEligible === 1 ? "" : "s"}`;

  return { text: `${onTimePct}%`, hint, hasData: true };
}

export interface PeriodOverPeriodChange {
  changeAbs: number;
  changePct: number | null;
  direction: "up" | "down" | "flat";
}

export function calculatePeriodOverPeriodChange(
  current: number,
  previous: number
): PeriodOverPeriodChange {
  const changeAbs = current - previous;
  const changePct = previous === 0 ? null : Math.round((changeAbs / previous) * 10000) / 100;
  const direction: PeriodOverPeriodChange["direction"] =
    changeAbs === 0 ? "flat" : changeAbs > 0 ? "up" : "down";

  return { changeAbs, changePct, direction };
}

// bucketStart arrives as a plain "YYYY-MM-DD" string (the `date` return type
// of get_revenue_by_period/get_load_volume_by_period). Parsed by splitting
// rather than `new Date(...)` + Intl formatting, so a chart never shifts a
// bucket's label to a neighboring day/month under a non-UTC local timezone.
export function bucketLabelFormatter(bucketStart: string, bucket: "week" | "month"): string {
  const [yearStr, monthStr, dayStr] = bucketStart.split("-");
  const monthLabel = MONTH_LABELS[Number(monthStr) - 1];

  return bucket === "month" ? `${monthLabel} ${yearStr}` : `${monthLabel} ${Number(dayStr)}`;
}

export interface CarrierPerformanceRow {
  carrierId: UUID;
  carrierName: string;
  totalLoads: number;
  deliveredLoads: number;
  onTimeCount: number;
  totalEligibleCount: number;
  onTimePct: number | null;
  excludedNoAuditTrailCount: number;
  totalCarrierPay: number;
}

export interface SummarizedCarrierPerformanceRow extends CarrierPerformanceRow {
  needsAttention: boolean;
}

// Sorts by onTimePct descending with nulls last -- a carrier with no
// scoreable loads yet is not the same as a carrier with a bad score, so it
// must never sort as if its rate were 0 (which would put it first, above
// every real low performer) or be coerced to a number at all.
//
// needsAttention is likewise never set for a null onTimePct: "below
// threshold" is a claim about a known score, and a carrier with no data
// hasn't demonstrated poor performance -- flagging it would be the same
// null-as-zero mistake formatOnTimePct exists to avoid.
export function summarizeCarrierPerformance(
  rows: CarrierPerformanceRow[],
  needsAttentionThreshold: number = DEFAULT_NEEDS_ATTENTION_THRESHOLD
): SummarizedCarrierPerformanceRow[] {
  return [...rows]
    .sort((a, b) => {
      if (a.onTimePct === null && b.onTimePct === null) return 0;
      if (a.onTimePct === null) return 1;
      if (b.onTimePct === null) return -1;
      return b.onTimePct - a.onTimePct;
    })
    .map((row) => ({
      ...row,
      needsAttention: row.onTimePct !== null && row.onTimePct < needsAttentionThreshold,
    }));
}
