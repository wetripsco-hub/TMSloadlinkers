"use client";

import React from "react";
import { formatMoney } from "@/lib/format";
import { TrendingDown, TrendingUp } from "lucide-react";

export interface DailyActivityItem {
  day: string; // e.g. "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"
  count: number;
  isToday?: boolean;
}

export interface WeeklyPerformanceCardsProps {
  dateRangeText: string;
  weeklySalesCents: number;
  salesChangePercent: number | null;
  weeklyShipmentCount: number;
  weeklyMarginPercent: number | null;
  weeklyMarginCents: number;
  dailyActivity: DailyActivityItem[];
}

export function WeeklyPerformanceCards({
  dateRangeText,
  weeklySalesCents,
  salesChangePercent,
  weeklyShipmentCount,
  weeklyMarginPercent,
  weeklyMarginCents,
  dailyActivity,
}: WeeklyPerformanceCardsProps) {
  // Max count for scaling the mini volume bars
  const maxDayCount = Math.max(...dailyActivity.map((d) => d.count), 1);

  const isSalesNegative = salesChangePercent != null && salesChangePercent < 0;
  const isSalesPositive = salesChangePercent != null && salesChangePercent > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
      {/* Card 1: Daily Activity & Summary */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        {/* Top: Days of the week mini volume bar chart */}
        <div className="w-full flex items-end justify-between gap-2 h-24 border-b border-slate-100 pb-3">
          {dailyActivity.map((item, idx) => {
            const heightPercent = item.count > 0 ? Math.max((item.count / maxDayCount) * 100, 20) : 4;
            const hasActivity = item.count > 0;

            return (
              <div
                key={`${item.day}-${idx}`}
                className="flex flex-1 flex-col items-center justify-end gap-2 h-full group"
              >
                <div className="w-full flex justify-center items-end h-full">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[28px] rounded-t-xs transition-all duration-300 ${
                      hasActivity
                        ? "bg-blue-300 group-hover:bg-blue-400"
                        : "bg-slate-200/60"
                    }`}
                    title={`${item.day}: ${item.count} shipment${item.count === 1 ? "" : "s"}`}
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-900">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer: 3 Summary Circles with Labels */}
        <div className="grid grid-cols-3 gap-2 pt-4">
          {/* Circle 1: Net Revenue */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
              {weeklySalesCents > 0 ? formatMoney(weeklySalesCents) : "—"}
            </div>
            <span className="mt-2 text-[11px] font-medium text-slate-500">
              Net revenue
            </span>
          </div>

          {/* Circle 2: Total Shipments */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-300 text-sm font-bold text-slate-800 shadow-xs">
              {weeklyShipmentCount > 0 ? weeklyShipmentCount : "—"}
            </div>
            <span className="mt-2 text-[11px] font-medium text-slate-500">
              Shipments
            </span>
          </div>

          {/* Circle 3: Avg Margin % */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
              {weeklyMarginPercent != null && !Number.isNaN(weeklyMarginPercent)
                ? `${Math.round(weeklyMarginPercent)}%`
                : "—"}
            </div>
            <span className="mt-2 text-[11px] font-medium text-slate-500">
              Avg margin
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Weekly Sales */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
            Weekly Sales
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {dateRangeText}
          </span>
        </div>

        {/* Hero Value & Trend Indicator */}
        <div className="my-auto py-5 flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-2.5">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatMoney(weeklySalesCents)}
            </span>
            {salesChangePercent != null && !Number.isNaN(salesChangePercent) && (
              <div
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${
                  isSalesNegative
                    ? "bg-rose-50 text-rose-600"
                    : isSalesPositive
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {isSalesNegative ? (
                  <TrendingDown className="h-3 w-3" />
                ) : isSalesPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : null}
                <span>
                  {salesChangePercent > 0 ? "+" : ""}
                  {salesChangePercent.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <span className="mt-1 text-xs font-medium text-slate-400">
            Net revenue
          </span>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-3 text-center">
          <span className="text-xs font-medium text-slate-600">
            {weeklyShipmentCount} Shipment{weeklyShipmentCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Card 3: Weekly Margin */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
            Weekly Margin
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {dateRangeText}
          </span>
        </div>

        {/* Hero Value & Trend Sparkline */}
        <div className="my-auto py-5 flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {weeklyMarginPercent != null && !Number.isNaN(weeklyMarginPercent)
                ? `${Math.round(weeklyMarginPercent)}%`
                : "—"}
            </span>

            {/* Turvo-style Sparkline */}
            <div className="flex items-center gap-1">
              <svg
                viewBox="0 0 50 20"
                className="w-12 h-6 overflow-visible"
                aria-hidden="true"
              >
                <path
                  d="M 2 10 Q 15 2, 26 15 T 48 8"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-[11px] font-semibold text-slate-400">
                {weeklyMarginPercent != null && !Number.isNaN(weeklyMarginPercent)
                  ? `${Math.max(Math.round(weeklyMarginPercent - 2), 0)}%`
                  : "15%"}
              </span>
            </div>
          </div>
          <span className="mt-1 text-xs font-medium text-slate-400">
            Avg margin
          </span>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-3 text-center">
          <span className="text-xs font-semibold text-slate-700">
            {formatMoney(weeklyMarginCents)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default WeeklyPerformanceCards;
