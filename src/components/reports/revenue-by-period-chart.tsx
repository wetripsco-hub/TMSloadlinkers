"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { bucketLabelFormatter } from "@/lib/domain/reports";
import type { RevenueByPeriodPoint, ReportBucket } from "@/lib/repositories/reports";

interface ChartRow {
  bucketLabel: string;
  revenue: number;
  margin: number;
}

function formatDollars(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
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
        Revenue: <span className="font-medium text-slate-900">{formatDollars(row.revenue)}</span>
      </p>
      <p className="text-slate-500">
        Margin: <span className="font-medium text-slate-900">{formatDollars(row.margin)}</span>
      </p>
    </div>
  );
}

export interface RevenueByPeriodChartProps {
  data: RevenueByPeriodPoint[];
  bucket: ReportBucket;
}

export function RevenueByPeriodChart({ data, bucket }: RevenueByPeriodChartProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No data for this period</p>;
  }

  const chartData: ChartRow[] = data.map((point) => ({
    bucketLabel: bucketLabelFormatter(point.bucketStart, bucket),
    revenue: point.revenue,
    margin: point.margin,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="bucketLabel"
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(value: number) => `$${Math.round(value / 1000)}k`}
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <Tooltip content={<TooltipContent />} cursor={{ fill: "rgba(148, 163, 184, 0.12)" }} />
        <Bar dataKey="revenue" fill="#465fff" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Line
          type="monotone"
          dataKey="margin"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={{ r: 3, fill: "#0ea5e9" }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
