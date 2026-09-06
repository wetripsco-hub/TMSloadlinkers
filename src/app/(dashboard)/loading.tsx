import React from "react";
import { CardSkeleton } from "@/components/ui/card-skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-3.5 w-32 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200" />
      </div>

      {/* Metric cards skeleton */}
      <CardSkeleton count={4} />

      {/* Data table skeleton */}
      <TableSkeleton rowCount={6} colCount={5} />
    </div>
  );
}
