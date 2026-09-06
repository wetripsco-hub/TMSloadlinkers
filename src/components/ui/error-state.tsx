"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error | string | null;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  error,
  onRetry,
  className = "",
}: ErrorStateProps) {
  const errorMessage =
    description ||
    (error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "An unexpected error occurred while loading this section. Please try again.");

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-xl border border-rose-200/80 bg-white p-8 sm:p-12 text-center shadow-sm ${className}`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">
        {title}
      </h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">
        {errorMessage}
      </p>
      {onRetry && (
        <div className="mt-5">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-colors"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;
