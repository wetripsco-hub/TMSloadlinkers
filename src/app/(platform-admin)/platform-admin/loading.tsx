import React from "react";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function PlatformAdminLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-4 w-80 animate-pulse rounded-lg bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-28 animate-pulse rounded-xl bg-slate-200/80" />
        <div className="h-28 animate-pulse rounded-xl bg-slate-200/80" />
        <div className="h-28 animate-pulse rounded-xl bg-slate-200/80" />
      </div>
      <TableSkeleton rowCount={6} colCount={5} />
    </div>
  );
}
