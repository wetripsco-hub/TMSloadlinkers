"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { verifyCarrier } from "@/app/(dashboard)/carriers/actions";
import type { CarrierRecord } from "@/lib/repositories/carriers";

// Extracted out of carrier-table.tsx so the carrier detail page (BUG 2) can
// embed the exact same "Verify Safety" behavior instead of re-implementing
// it. carrier-table.tsx previously tracked verifyingId/verificationFeedback
// at the table level, matched against each row's carrier.id -- this
// componentizes that into per-instance state instead, since each usage now
// only ever concerns its own carrier. Feedback copy, timings (3s for an
// error, 4s for a success), and the FMCSA re-check call are unchanged.
export function VerifyCarrierSafetyButton({ carrier }: { carrier: CarrierRecord }) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(
    null
  );

  async function handleVerifySafety() {
    if (!carrier.dotNumber && !carrier.mcNumber) {
      setFeedback({ message: "No DOT/MC on file", type: "error" });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setIsVerifying(true);
    try {
      const updated = await verifyCarrier(carrier.id, {
        dotNumber: carrier.dotNumber || undefined,
        mcNumber: carrier.mcNumber || undefined,
      });
      setFeedback({
        message: `${updated.safetyRating.toUpperCase()} · Authority: ${updated.authorityStatus}`,
        type: "success",
      });
      setTimeout(() => setFeedback(null), 4000);
      router.refresh();
    } catch (err) {
      setFeedback({
        message: err instanceof Error ? err.message : "Verification failed",
        type: "error",
      });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsVerifying(false);
    }
  }

  if (feedback) {
    return (
      <span
        className={
          feedback.type === "success"
            ? "inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"
            : "inline-flex items-center gap-1 text-xs font-semibold text-rose-600"
        }
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        {feedback.message}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleVerifySafety}
      disabled={isVerifying}
      aria-label={`Verify safety compliance for ${carrier.companyName}`}
      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:underline"
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      {isVerifying ? "Verifying..." : "Verify Safety"}
    </button>
  );
}

export default VerifyCarrierSafetyButton;
