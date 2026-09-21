"use server";

import { listSortedQuotesForOrg, type QuoteListItem } from "@/lib/repositories/quotes";

// Read-only refetch for QuotesList's polling (components/loads/quotes-list.tsx)
// -- a shipper counter-offer can land at any time from the public
// /quote/[token] page, with nothing to push a notification back to this
// tab, so the list polls this on an interval rather than only updating on
// a manual reload or this broker's own next action.
export async function refreshQuotesListAction(): Promise<QuoteListItem[]> {
  return listSortedQuotesForOrg();
}
