import { FileQuestion } from "lucide-react";
import { getQuoteByToken } from "@/lib/repositories/quotes";
import { QuoteResponseView } from "@/components/quote/quote-response-view";
import { EmptyState } from "@/components/ui/empty-state";

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // get_quote_by_token raises when no quote matches the token (see
  // lib/repositories/quotes.ts) -- caught here, same shape as
  // app/track/[token]/page.tsx's null-load check, so an invalid or
  // mistyped link renders a clean message instead of a 500/stack trace.
  let quote;
  try {
    quote = await getQuoteByToken(token);
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
        <div className="mx-auto max-w-md">
          <EmptyState
            icon={FileQuestion}
            title="This quote link is invalid"
            description="It may have been typed incorrectly, or the quote it pointed to no longer exists. Contact your broker for a new link."
          />
        </div>
      </div>
    );
  }

  return <QuoteResponseView token={token} quote={quote} />;
}
