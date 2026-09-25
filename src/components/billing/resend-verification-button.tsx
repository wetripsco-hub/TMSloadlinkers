"use client";

import { useState } from "react";
import { resendVerificationEmail } from "@/app/actions/resend-verification-email";

export function ResendVerificationButton({ isSevere }: { isSevere: boolean }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleClick() {
    setStatus("sending");
    const { error } = await resendVerificationEmail();
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return <span className="text-xs font-semibold text-emerald-700">Verification email sent</span>;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "sending"}
      className={`inline-flex shrink-0 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-60 ${
        isSevere
          ? "bg-rose-600 text-white hover:bg-rose-700"
          : "bg-amber-600 text-white hover:bg-amber-700"
      }`}
    >
      {status === "sending"
        ? "Sending..."
        : status === "error"
          ? "Try again"
          : "Resend verification email"}
    </button>
  );
}
