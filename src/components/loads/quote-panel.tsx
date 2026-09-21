"use client";

import { useState } from "react";
import { DollarSign, Send, AlertTriangle, Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMoney, formatDateTime } from "@/lib/format";
import { parseCents } from "@/lib/money";
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from "@/lib/domain/quote-status";
import { sendQuote } from "@/app/(dashboard)/loads/[id]/quotes/actions";
import { QuoteRespondActions } from "@/components/loads/quote-respond-actions";
import { NegotiationTimeline } from "@/components/loads/negotiation-timeline";
import type { Load, Quote, QuoteNegotiationEvent, QuoteStatus } from "../../../types/domain";

// Mirrors the same early-status gate as sendQuote's own server-side check
// (app/(dashboard)/loads/[id]/quotes/actions.ts) -- kept here in sync
// rather than exported from that "use server" file, which may only export
// async functions.
const QUOTABLE_LOAD_STATUSES = new Set<Load["status"]>(["quoted", "posted_to_boards"]);

const TERMINAL_QUOTE_STATUSES = new Set<QuoteStatus>(["declined", "expired", "cancelled"]);

// The public shipper-facing page this feeds -- app/quote/[token]/page.tsx,
// token-authenticated via get_quote_by_token, no login.
function publicQuotePath(trackingToken: string): string {
  return `/quote/${trackingToken}`;
}

export function QuotePanel({
  load,
  quote,
  events,
  onQuoteRefresh,
}: {
  load: Load;
  quote: Quote | null;
  events: QuoteNegotiationEvent[];
  // Called after this broker's own action succeeds, and owned by the
  // parent (LoadDetailTabs) rather than a plain router.refresh() here --
  // the parent also polls this same fetch on an interval so a shipper's
  // counter-offer shows up without a manual reload, and both paths need to
  // update the exact same state.
  onQuoteRefresh: () => void;
}) {
  const [rateInput, setRateInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canSendNewQuote =
    QUOTABLE_LOAD_STATUSES.has(load.status) && (!quote || TERMINAL_QUOTE_STATUSES.has(quote.status));
  const needsResponse = quote?.status === "countered_by_shipper";

  async function handleSendQuote() {
    setSendError(null);
    let cents: number;
    try {
      cents = parseCents(rateInput);
    } catch {
      setSendError("Enter a valid rate, e.g. 1500.00");
      return;
    }
    if (cents <= 0) {
      setSendError("Rate must be greater than zero");
      return;
    }

    setIsSending(true);
    try {
      await sendQuote(load.id, cents);
      setRateInput("");
      onQuoteRefresh();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Could not send quote");
    } finally {
      setIsSending(false);
    }
  }

  async function handleCopyLink() {
    if (!quote) return;
    const url = `${window.location.origin}${publicQuotePath(quote.trackingToken)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (permissions, non-secure context);
      // the link is still visible as text for a manual copy.
    }
  }

  return (
    <div id="quote-panel" className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-slate-400" />
          Quote
        </h3>
        {quote && (
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
              QUOTE_STATUS_COLORS[quote.status]
            )}
          >
            {QUOTE_STATUS_LABELS[quote.status]}
          </span>
        )}
      </div>

      {needsResponse && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <p className="text-xs font-medium text-amber-800">
            Shipper countered at {quote ? formatMoney(quote.proposedRate) : ""} — needs your response.
          </p>
        </div>
      )}

      {quote && (
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-slate-500">Current proposed rate</dt>
              <dd className="font-semibold text-slate-900 text-sm">{formatMoney(quote.proposedRate)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Expires</dt>
              <dd className="font-semibold text-slate-700">{formatDateTime(quote.expiresAt)}</dd>
            </div>
          </dl>

          <div>
            <span className="block text-xs text-slate-500 mb-1">Shareable link</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
                {publicQuotePath(quote.trackingToken)}
              </code>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
              >
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {needsResponse && (
            <div className="rounded-lg border border-slate-200 p-3">
              <QuoteRespondActions
                quoteId={quote.id}
                loadId={load.id}
                onResponded={onQuoteRefresh}
              />
            </div>
          )}

          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Negotiation history
            </span>
            <NegotiationTimeline events={events} viewerActorType="broker" />
          </div>
        </div>
      )}

      {canSendNewQuote && (
        <div className={cn("space-y-2", quote && "mt-4 pt-4 border-t border-slate-100")}>
          {!quote && <p className="text-xs text-slate-400 mb-1">No quote sent yet.</p>}
          {sendError && <p className="text-xs text-rose-600">{sendError}</p>}
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              placeholder="Proposed rate, e.g. 1500.00"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleSendQuote}
              disabled={isSending || !rateInput.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" />
              {isSending ? "Sending..." : "Send Quote"}
            </button>
          </div>
        </div>
      )}

      {!quote && !canSendNewQuote && (
        <p className="text-xs text-slate-400">
          Quotes can only be sent while a load is in &quot;Quoted&quot; or &quot;Posted to Boards&quot; status.
        </p>
      )}
    </div>
  );
}
