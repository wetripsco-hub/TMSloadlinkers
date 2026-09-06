import React from "react";

export interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export function CardSkeleton({ count = 4, className = "" }: CardSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading metric cards"
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex h-32 flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
            <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
          </div>
          <div>
            <div className="mb-2 h-7 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-3.5 w-20 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default CardSkeleton;
