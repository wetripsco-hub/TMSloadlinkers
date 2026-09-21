"use server";

import { revalidatePath } from "next/cache";
import { getLoadById } from "@/lib/repositories/loads";
import {
  createQuote,
  respondAsBroker,
  listQuotesForLoad,
  listNegotiationEventsForQuote,
  type RespondToQuoteAction,
} from "@/lib/repositories/quotes";
import type { Cents, Quote, QuoteNegotiationEvent, UUID } from "../../../../../../types/domain";

// Loads early enough in their lifecycle to quote out -- mirrors the
// "quoted/posted_to_boards" gate the calling UI (Send Quote action) uses to
// decide whether to show the button at all. Re-checked here, server-side,
// so a stale client (a tab left open after the load moved on) can't send a
// quote for a load that no longer belongs in this stage; createQuote's
// plain INSERT has no status check of its own to fall back on.
const QUOTABLE_LOAD_STATUSES = ["quoted", "posted_to_boards"];

export async function sendQuote(loadId: UUID, proposedRate: Cents): Promise<Quote> {
  if (proposedRate <= 0) {
    throw new Error("Proposed rate must be greater than zero");
  }

  const load = await getLoadById(loadId);
  if (!load) {
    throw new Error("Load not found");
  }
  if (!QUOTABLE_LOAD_STATUSES.includes(load.status)) {
    throw new Error(`Load status "${load.status}" is too far along to send a new quote`);
  }

  const quote = await createQuote(loadId, proposedRate);

  revalidatePath(`/loads/${loadId}`);

  return quote;
}

// Single write path for the broker side of a negotiation -- both "Accept
// Counter" and "Send New Counter" call this with action "accept" or
// "counter" respectively. Delegates entirely to the
// respond_to_quote_as_broker RPC (see lib/repositories/quotes.ts); this
// action only adds revalidation on top.
export async function respondToQuoteAsBroker(
  quoteId: UUID,
  loadId: UUID,
  action: RespondToQuoteAction,
  counterRate: Cents | null,
  note: string | null
): Promise<Quote> {
  if (action === "counter" && (counterRate === null || counterRate <= 0)) {
    throw new Error("Counter rate must be greater than zero");
  }

  const quote = await respondAsBroker(quoteId, action, counterRate, note);

  revalidatePath(`/loads/${loadId}`);
  // The org-wide "needs response" list only shows quotes currently in
  // countered_by_shipper -- responding always moves the quote out of that
  // status, so the list on /loads needs to drop this quote too.
  revalidatePath("/loads");

  return quote;
}

export interface QuoteForLoad {
  quote: Quote | null;
  events: QuoteNegotiationEvent[];
}

// Read-only refetch for LoadDetailTabs's polling
// (components/loads/load-detail-tabs.tsx) -- a shipper counter-offer can
// land at any time from the public /quote/[token] page, with nothing to
// push a notification back to an already-open load detail tab, so this is
// polled on an interval rather than only updating on this broker's own
// next action or a manual reload. Same "newest quote is the active
// thread" selection as app/(dashboard)/loads/[id]/page.tsx's initial
// server-side fetch, so a poll tick never disagrees with what the page
// loaded with.
export async function refreshQuoteForLoadAction(loadId: UUID): Promise<QuoteForLoad> {
  const quotes = await listQuotesForLoad(loadId);
  const quote = quotes[0] ?? null;
  const events = quote ? await listNegotiationEventsForQuote(quote.id) : [];
  return { quote, events };
}
