"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import type { ReportBucket } from "@/lib/repositories/reports";

const BUCKETS: ReportBucket[] = ["week", "month"];

export interface BucketToggleProps {
  bucket: ReportBucket;
}

// Bucket lives in the URL, same as the date range -- switching it navigates
// (re-fetching server-aggregated data), it never recomputes buckets client-side.
export function BucketToggle({ bucket }: BucketToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setBucket(next: ReportBucket) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("bucket", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex rounded-md border border-slate-200 p-0.5">
      {BUCKETS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => setBucket(key)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors",
            bucket === key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          )}
        >
          {key}
        </button>
      ))}
    </div>
  );
}
