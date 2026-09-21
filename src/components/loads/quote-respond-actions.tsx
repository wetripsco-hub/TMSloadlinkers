"use client";

import { useState } from "react";
import { Check, Repeat2, Send } from "lucide-react";

import { parseCents } from "@/lib/money";
import { respondToQuoteAsBroker } from "@/app/(dashboard)/loads/[id]/quotes/actions";
import type { UUID } from "../../../types/domain";

// The broker-side "Accept Counter" / "Send New Counter" controls for a quote
// currently sitting in countered_by_shipper. Shared between
// components/loads/quote-panel.tsx (load detail Financials tab) and
// app/(dashboard)/quotes (the org-wide list, inline per row) so the two
// surfaces stay a single implementation of "respond to a counter" rather
// than two copies that can drift.
export function QuoteRespondActions({
  quoteId,
  loadId,
  onResponded,
}: {
  quoteId: UUID;
  loadId: UUID;
  onResponded: () => void;
}) {
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterRateInput, setCounterRateInput] = useState("");
  const [counterNote, setCounterNote] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAcceptCounter() {
    setError(null);
    setIsResponding(true);
    try {
      await respondToQuoteAsBroker(quoteId, loadId, "accept", null, null);
      onResponded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept counter");
    } finally {
      setIsResponding(false);
    }
  }

  async function handleSendNewCounter() {
    setError(null);
    let cents: number;
    try {
      cents = parseCents(counterRateInput);
    } catch {
      setError("Enter a valid rate, e.g. 1500.00");
      return;
    }
    if (cents <= 0) {
      setError("Rate must be greater than zero");
      return;
    }

    setIsResponding(true);
    try {
      await respondToQuoteAsBroker(quoteId, loadId, "counter", cents, counterNote.trim() || null);
      setShowCounterForm(false);
      setCounterRateInput("");
      setCounterNote("");
      onResponded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send counter");
    } finally {
      setIsResponding(false);
    }
  }

  return (
    <div className="space-y-2.5">
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleAcceptCounter}
          disabled={isResponding}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Check className="h-3.5 w-3.5" />
          Accept Counter
        </button>
        <button
          type="button"
          onClick={() => setShowCounterForm((v) => !v)}
          disabled={isResponding}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Repeat2 className="h-3.5 w-3.5 text-slate-400" />
          Send New Counter
        </button>
      </div>

      {showCounterForm && (
        <div className="flex flex-col gap-2 pt-1">
          <input
            type="text"
            inputMode="decimal"
            value={counterRateInput}
            onChange={(e) => setCounterRateInput(e.target.value)}
            placeholder="New rate, e.g. 1500.00"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            value={counterNote}
            onChange={(e) => setCounterNote(e.target.value)}
            placeholder="Note to shipper (optional)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSendNewCounter}
            disabled={isResponding || !counterRateInput.trim()}
            className="self-start inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" />
            {isResponding ? "Sending..." : "Send Counter"}
          </button>
        </div>
      )}
    </div>
  );
}
