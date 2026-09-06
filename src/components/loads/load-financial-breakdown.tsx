"use client";

import { DollarSign } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { FinancialFieldKey } from "@/lib/domain/workspace";
import { useWorkspaceMode } from "@/hooks/use-workspace-mode";
import type { Load } from "../../../types/domain";

const FIELD_LABELS: Record<FinancialFieldKey, string> = {
  shipperRate: "Shipper Rate",
  carrierPay: "Carrier Pay",
  brokerMargin: "Broker Net Margin",
  dispatcherCommissionEarned: "Dispatcher Commission",
};

export function LoadFinancialBreakdown({ load }: { load: Load }) {
  const { visibleFinancialFields, isLoading } = useWorkspaceMode();

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-3 mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-slate-400" />
          Financial Breakdown
        </h3>
      </div>

      <div>
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading workspace financials...</p>
        ) : (
          <dl className="grid grid-cols-2 gap-3">
            {visibleFinancialFields.map((field) => {
              const isMargin = field === "brokerMargin";
              return (
                <div
                  key={field}
                  className={`flex flex-col gap-1 rounded-lg border p-3 ${
                    isMargin
                      ? "bg-emerald-50/60 border-emerald-200/70"
                      : "bg-slate-50/70 border-slate-100"
                  }`}
                >
                  <dt className={`text-xs font-medium ${isMargin ? "text-emerald-700" : "text-slate-500"}`}>
                    {FIELD_LABELS[field]}
                  </dt>
                  <dd
                    className={`text-base font-bold tabular-nums ${
                      isMargin ? "text-emerald-700" : "text-slate-900"
                    }`}
                  >
                    {formatMoney(load[field])}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </div>
    </div>
  );
}
