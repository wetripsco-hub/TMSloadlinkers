"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { sendTrackingLink } from "@/app/actions/send-tracking-link";
import { cn } from "@/lib/utils";

type ButtonStatus = "idle" | "sending" | "sent" | "error";

export function SendTrackingLinkButton({
  loadId,
  driverPhone,
}: {
  loadId: string;
  driverPhone: string | null;
}) {
  const [status, setStatus] = useState<ButtonStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasPhone = Boolean(driverPhone?.trim());

  function handleClick() {
    if (!hasPhone || isPending) return;

    setStatus("sending");
    setError(null);

    startTransition(async () => {
      const result = await sendTrackingLink(loadId);

      if (result.success) {
        setStatus("sent");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={!hasPhone || status === "sending"}
        title={!hasPhone ? "Add a driver phone number first" : undefined}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
          status === "error"
            ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
            : status === "sent"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        )}
      >
        <Send className="h-3.5 w-3.5 text-slate-400" />
        {status === "sending" && "Sending..."}
        {status === "sent" && "Sent ✓"}
        {status === "error" && "Couldn't send"}
        {status === "idle" && "Send Tracking Link"}
      </button>
      {status === "error" && error && (
        <span className="max-w-[220px] text-right text-[11px] font-medium text-rose-600">
          {error}
        </span>
      )}
    </div>
  );
}
