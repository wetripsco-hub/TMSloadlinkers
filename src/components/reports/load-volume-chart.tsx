"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { bucketLabelFormatter } from "@/lib/domain/reports";
import type { LoadVolumePoint, ReportBucket } from "@/lib/repositories/reports";

interface ChartRow {
  bucketLabel: string;
  loadCount: number;
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
        Loads: <span className="font-medium text-slate-900">{row.loadCount}</span>
      </p>
    </div>
  );
}

export interface LoadVolumeChartProps {
  data: LoadVolumePoint[];
  bucket: ReportBucket;
}

export function LoadVolumeChart({ data, bucket }: LoadVolumeChartProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No data for this period</p>;
  }

  const chartData: ChartRow[] = data.map((point) => ({
    bucketLabel: bucketLabelFormatter(point.bucketStart, bucket),
    loadCount: point.loadCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="bucketLabel"
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <Tooltip content={<TooltipContent />} cursor={{ fill: "rgba(148, 163, 184, 0.12)" }} />
        <Bar dataKey="loadCount" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
