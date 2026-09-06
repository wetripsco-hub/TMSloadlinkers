"use client";

import React, { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error boundary caught error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <ErrorState
          title="Unable to load dashboard view"
          description={
            error?.message ||
            "A query or rendering error occurred. You can retry the operation or refresh the page."
          }
          onRetry={reset}
        />
      </div>
    </div>
  );
}
