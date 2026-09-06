import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import type { AccessStatus } from "@/lib/subscription/guard";

export function AccessBanner({ status }: { status: AccessStatus }) {
  if (!status.message) return null;

  const isSevere = status.state === "past_due" || status.state === "locked";
  const actionLabel = status.state === "past_due" ? "Update card" : "View plans";

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${
        isSevere
          ? "border-rose-200 bg-rose-50"
          : "border-amber-300 bg-amber-50"
      }`}
    >
      <div className="flex items-center gap-3">
        {isSevere ? (
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
        ) : (
          <Clock className="h-5 w-5 shrink-0 text-amber-600" />
        )}
        <p
          className={`text-sm font-medium ${
            isSevere ? "text-rose-800" : "text-amber-800"
          }`}
        >
          {status.message}
        </p>
      </div>
      <Link
        href="/settings/billing"
        className={`inline-flex shrink-0 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
          isSevere
            ? "bg-rose-600 text-white hover:bg-rose-700"
            : "bg-amber-600 text-white hover:bg-amber-700"
        }`}
      >
        {actionLabel}
      </Link>
    </div>
  );
}
