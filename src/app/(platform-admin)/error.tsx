"use client";

import React, { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function PlatformAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Platform Admin uncaught error:", error);
  }, [error]);

  return (
    <div className="py-8">
      <ErrorState
        title="Platform Admin Error"
        description="An unexpected error occurred while processing this administrative view."
        error={error}
        onRetry={reset}
      />
    </div>
  );
}
