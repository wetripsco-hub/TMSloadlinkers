"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { STATUS_LABELS } from "@/components/loads/load-status-badge";
import type { LoadsByStatus } from "@/lib/repositories/dashboard";
import type { LoadStatus } from "../../../types/domain";

const STATUS_HEX: Record<LoadStatus, string> = {
  quoted: "#64748b",
  posted_to_boards: "#3b82f6",
  covered: "#6366f1",
  dispatched: "#8b5cf6",
  at_pickup: "#f59e0b",
  in_transit: "#f97316",
  at_delivery: "#f59e0b",
  delivered: "#22c55e",
  pod_uploaded: "#10b981",
  invoiced: "#14b8a6",
  settled: "#16a34a",
  cancelled: "#ef4444",
};

interface SliceRow {
  status: LoadStatus;
  label: string;
  count: number;
  fill: string;
}

function TooltipContent({ active, payload }: { active?: boolean; payload?: { payload: SliceRow }[] }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-900">
      <p className="font-semibold text-gray-900 dark:text-white">{row.label}</p>
      <p className="text-gray-500 dark:text-gray-400">{row.count} loads</p>
    </div>
  );
}

export function LoadsStatusDonut({ data }: { data: LoadsByStatus[] }) {
  const slices: SliceRow[] = data
    .filter((row) => row.count > 0)
    .map((row) => ({
      status: row.status,
      label: STATUS_LABELS[row.status],
      count: row.count,
      fill: STATUS_HEX[row.status],
    }));

  const total = slices.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="count"
            nameKey="label"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={2}
            strokeWidth={0}
          >
            {slices.map((slice) => (
              <Cell key={slice.status} fill={slice.fill} />
            ))}
          </Pie>
          <Tooltip content={<TooltipContent />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{total}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">loads</span>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {slices.map((slice) => (
          <li key={slice.status} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: slice.fill }} />
            <span className="truncate">{slice.label}</span>
            <span className="ml-auto font-medium text-gray-900 dark:text-white">{slice.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
