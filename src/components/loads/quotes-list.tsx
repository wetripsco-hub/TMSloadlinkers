"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Handshake } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMoney, formatRelativeTime } from "@/lib/format";
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from "@/lib/domain/quote-status";
import { QuoteRespondActions } from "@/components/loads/quote-respond-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { refreshQuotesListAction } from "@/app/(dashboard)/quotes/actions";
import type { QuoteListItem } from "@/lib/repositories/quotes";

// A shipper can accept/decline/counter from the public /quote/[token] page
// at any time, with nothing to push a notification back to an already-open
// /quotes tab -- so this list polls on an interval rather than only
// refreshing on this broker's own next action or a manual reload. Same
// cadence as the load notes panel's driver-message polling
// (components/loads/load-notes-panel.tsx) and the load-detail quote poll
// (components/loads/load-detail-tabs.tsx).
const QUOTE_POLL_INTERVAL_MS = 15000;

// Condensed one-line version of the same action wording used by
// QuotePanel's NegotiationTimeline (components/loads/quote-panel.tsx).
function lastEventSummary(quote: QuoteListItem): string {
  if (!quote.lastEvent) {
    return "Sent — no response yet";
  }
  const who = quote.lastEvent.actorType === "shipper" ? "Shipper" : "You";
  const verb = quote.lastEvent.action === "countered" ? "countered at" : quote.lastEvent.action;
  const rate = quote.lastEvent.rate !== null ? ` ${formatMoney(quote.lastEvent.rate)}` : "";
  return `${who} ${verb}${rate}`;
}

function QuoteRow({ quote, onResponded }: { quote: QuoteListItem; onResponded: () => void }) {
  const needsResponse = quote.status === "countered_by_shipper";
  const loadLabel = quote.loadNumber || `LD-${quote.loadId.slice(0, 6).toUpperCase()}`;

  return (
    <li
      className={cn(
        "px-4 py-3.5",
        needsResponse && "border-l-4 border-l-amber-400 bg-amber-50/50"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {needsResponse && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />}
            <Link
              href={`/loads/${quote.loadId}#quote-panel`}
              className="text-sm font-semibold text-slate-900 hover:underline"
            >
              {loadLabel}
            </Link>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                QUOTE_STATUS_COLORS[quote.status]
              )}
            >
              {QUOTE_STATUS_LABELS[quote.status]}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{lastEventSummary(quote)}</p>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold text-slate-900">{formatMoney(quote.proposedRate)}</div>
          <div className="text-xs text-slate-400">{formatRelativeTime(quote.updatedAt)}</div>
        </div>
      </div>

      {needsResponse && (
        <div className="mt-3 border-t border-amber-200/70 pt-3">
          <QuoteRespondActions quoteId={quote.id} loadId={quote.loadId} onResponded={onResponded} />
        </div>
      )}
    </li>
  );
}

export function QuotesList({ initialQuotes }: { initialQuotes: QuoteListItem[] }) {
  const [quotes, setQuotes] = useState<QuoteListItem[]>(initialQuotes);

  const refresh = useCallback(async () => {
    try {
      const fresh = await refreshQuotesListAction();
      setQuotes(fresh);
    } catch {
      // Best-effort -- the next poll tick (or this broker's own next
      // action) retries.
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, QUOTE_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  if (quotes.length === 0) {
    return (
      <EmptyState
        icon={Handshake}
        title="No quotes yet"
        description="Quotes you send from a load's Financials tab will show up here."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <ul className="divide-y divide-slate-100">
        {quotes.map((quote) => (
          <QuoteRow key={quote.id} quote={quote} onResponded={refresh} />
        ))}
      </ul>
    </div>
  );
}
