import React from "react";

export interface TableSkeletonProps {
  rowCount?: number;
  colCount?: number;
  className?: string;
}

export function TableSkeleton({
  rowCount = 6,
  colCount = 5,
  className = "",
}: TableSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading table data"
      className={`overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm ${className}`}
    >
      {/* Search / Filter toolbar placeholder */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-100" />
        <div className="flex gap-2">
          <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </div>

      {/* Table header */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-4 py-3.5">
        {Array.from({ length: colCount }).map((_, i) => (
          <div
            key={i}
            className={`h-3.5 animate-pulse rounded bg-slate-200 ${
              i === 0 ? "w-28" : i === colCount - 1 ? "w-16" : "w-20"
            }`}
          />
        ))}
      </div>

      {/* Table rows */}
      <div className="divide-y divide-slate-100 bg-white">
        {Array.from({ length: rowCount }).map((_, r) => (
          <div
            key={r}
            className="flex items-center justify-between gap-4 px-4 py-4"
          >
            {Array.from({ length: colCount }).map((_, c) => (
              <div
                key={c}
                className={`h-4 animate-pulse rounded bg-slate-100 ${
                  c === 0
                    ? "w-32"
                    : c === colCount - 1
                    ? "w-16"
                    : c % 2 === 0
                    ? "w-24"
                    : "w-20"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TableSkeleton;
