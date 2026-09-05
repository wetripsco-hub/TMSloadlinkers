"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCents } from "@/lib/money";
import type { RevenueWeek } from "@/lib/repositories/dashboard";

function formatWeekLabel(weekStart: string): string {
  if (!weekStart) return "";
  const date = new Date(`${weekStart}T00:00:00Z`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

interface ChartRow {
  weekLabel: string;
  revenue: number;
  marginPercent: number;
}

function TooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: ChartRow }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="rounded-md border border-slate-200/80 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-slate-500">
        Revenue: <span className="font-medium text-slate-900">{formatCents(row.revenue)}</span>
      </p>
      <p className="text-slate-500">
        Margin: <span className="font-medium text-slate-900">{row.marginPercent.toFixed(1)}%</span>
      </p>
    </div>
  );
}

export function RevenueMarginChart({ data }: { data: RevenueWeek[] }) {
  const chartData: ChartRow[] = data.map((row) => ({
    weekLabel: formatWeekLabel(row.weekStart),
    revenue: row.revenueCents,
    marginPercent: row.marginPercent,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="weekLabel"
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="revenue"
          tickFormatter={(value: number) => `$${Math.round(value / 100_00)}k`}
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <YAxis
          yAxisId="margin"
          orientation="right"
          tickFormatter={(value: number) => `${value}%`}
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip content={<TooltipContent />} cursor={{ fill: "rgba(148, 163, 184, 0.12)" }} />
        <Bar yAxisId="revenue" dataKey="revenue" fill="#465fff" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Line
          yAxisId="margin"
          type="monotone"
          dataKey="marginPercent"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={{ r: 3, fill: "#0ea5e9" }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
