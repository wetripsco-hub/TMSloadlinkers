import { User, Truck } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMoney, formatDateTime } from "@/lib/format";

// Structural subset of QuoteNegotiationEvent (types/domain.ts) --
// QuoteNegotiationEvent[] is assignable here as-is (broker side,
// components/loads/quote-panel.tsx). PublicQuoteEvent[]
// (lib/repositories/quotes.ts) is the same shape without the id/orgId/
// quoteId/actorUserId fields the public RPC never returns, so the
// shipper-facing page (app/quote/[token]) can pass it directly too --
// one timeline renderer, two callers, instead of two copies of this
// formatting logic drifting apart.
export interface NegotiationTimelineEvent {
  actorType: "broker" | "shipper";
  action: "sent" | "accepted" | "declined" | "countered";
  rate: number | null;
  note: string | null;
  createdAt: string;
}

// viewerActorType flips "You" vs. the counterpart's label/color -- the
// broker's own panel passes "broker" so broker events read as "You"; the
// public shipper page passes "shipper" so shipper events read as "You"
// there instead. Same event data, correct pronoun on both sides.
export function NegotiationTimeline({
  events,
  viewerActorType,
}: {
  events: NegotiationTimelineEvent[];
  viewerActorType: "broker" | "shipper";
}) {
  if (events.length === 0) {
    return <p className="text-xs text-slate-400">No responses yet.</p>;
  }

  return (
    <ol className="space-y-2.5">
      {events.map((event, index) => {
        const isViewer = event.actorType === viewerActorType;
        const label = isViewer ? "You" : event.actorType === "shipper" ? "Shipper" : "Broker";

        return (
          <li key={index} className="flex gap-2.5 text-xs">
            <div
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                isViewer
                  ? "border-blue-200 bg-blue-50 text-blue-600"
                  : "border-purple-200 bg-purple-50 text-purple-600"
              )}
            >
              {event.actorType === "shipper" ? <User className="h-3 w-3" /> : <Truck className="h-3 w-3" />}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-semibold text-slate-800">{label}</span>
                <span className="text-slate-500">
                  {event.action === "countered" ? "countered at" : event.action}
                  {event.rate !== null ? ` ${formatMoney(event.rate)}` : ""}
                </span>
                <span className="text-slate-400">· {formatDateTime(event.createdAt)}</span>
              </div>
              {event.note && <p className="mt-0.5 text-slate-600">{event.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
