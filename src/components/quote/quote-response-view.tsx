"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Repeat2,
  Sun,
  Moon,
  MapPin,
  Truck,
  Package,
  Scale,
  Calendar,
  AlertCircle,
  Clock,
  Ban,
  ThumbsDown,
  Send,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMoney, formatDate } from "@/lib/format";
import { parseCents } from "@/lib/money";
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from "@/lib/domain/quote-status";
import { NegotiationTimeline } from "@/components/loads/negotiation-timeline";
import { submitQuoteResponseAction } from "@/app/quote/[token]/actions";
import type { PublicQuote } from "@/lib/repositories/quotes";
import type { QuoteStatus } from "../../../types/domain";

const RESPONDABLE_STATUSES = new Set<QuoteStatus>(["sent", "countered_by_broker"]);

// Read-only terminal states (item 2): each gets its own icon/message, no
// action buttons. countered_by_shipper never reaches this page -- that's
// the broker's turn, not the shipper's -- so it isn't listed here; if the
// RPC ever returned it mid-session (shouldn't, but this page is public and
// the response isn't trusted further than that) it just falls through to
// "no actions available" via the RESPONDABLE_STATUSES check below.
const STATUS_MESSAGES: Partial<Record<QuoteStatus, { icon: typeof Check; text: string }>> = {
  accepted: { icon: Check, text: "You accepted this rate. Your broker has been notified." },
  declined: { icon: ThumbsDown, text: "You declined this quote." },
  expired: { icon: Clock, text: "This quote link has expired. Contact your broker for a new one." },
  cancelled: { icon: Ban, text: "This quote was cancelled by the broker." },
};

function LoadSummaryRow({
  icon: Icon,
  label,
  value,
  isDark,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isDark ? "bg-slate-800 text-blue-400" : "bg-blue-50 text-blue-600"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className={cn("text-[11px] font-semibold uppercase tracking-wider", isDark ? "text-slate-500" : "text-slate-400")}>
          {label}
        </p>
        <p className={cn("text-sm font-semibold truncate", isDark ? "text-white" : "text-slate-900")}>{value}</p>
      </div>
    </div>
  );
}

export function QuoteResponseView({ token, quote }: { token: string; quote: PublicQuote }) {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterRateInput, setCounterRateInput] = useState("");
  const [counterNote, setCounterNote] = useState("");

  const canRespond = RESPONDABLE_STATUSES.has(quote.status);
  const statusMessage = STATUS_MESSAGES[quote.status];

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  async function respond(action: "accept" | "decline" | "counter", counterRateCents: number | null, note: string | null) {
    setError(null);
    setIsSubmitting(true);
    try {
      await submitQuoteResponseAction(token, action, counterRateCents, note);
      showToast(
        action === "accept" ? "Rate accepted" : action === "decline" ? "Quote declined" : "Counter-offer sent"
      );
      setShowDeclineConfirm(false);
      setShowCounterForm(false);
      setCounterRateInput("");
      setCounterNote("");
      router.refresh();
    } catch (err) {
      // Covers both a genuine failure and someone else (or this same
      // shipper, in another tab) having already responded / the quote
      // expiring in between this page loading and the click -- either way
      // the RPC's own message is shown as-is rather than guessed at, and
      // refreshing picks up whatever the quote's real current status now
      // is so the UI can't get stuck offering an action that will just
      // fail again.
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCounterSubmit() {
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
    respond("counter", cents, counterNote.trim() || null);
  }

  const lane =
    quote.originCity && quote.destinationCity
      ? `${quote.originCity}, ${quote.originState ?? ""} → ${quote.destinationCity}, ${quote.destinationState ?? ""}`
      : "Lane details unavailable";

  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-200 flex flex-col items-center justify-start",
        isDark ? "bg-[#111015] text-slate-100" : "bg-slate-100 text-slate-900"
      )}
    >
      {toast && (
        <div className="fixed top-4 z-50 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xl">
          <Check className="h-3.5 w-3.5" />
          <span>{toast}</span>
        </div>
      )}

      <div
        className={cn(
          "w-full max-w-md min-h-screen sm:min-h-0 sm:my-6 sm:rounded-[36px] sm:shadow-2xl overflow-hidden flex flex-col border transition-all duration-200",
          isDark ? "bg-[#18171d] border-slate-800" : "bg-white border-slate-200/80"
        )}
      >
        <header
          className={cn(
            "px-4 py-3 flex items-center justify-between border-b",
            isDark ? "bg-[#18171d] border-slate-800/80" : "bg-white border-slate-100"
          )}
        >
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold tracking-tight">
              {quote.loadNumber ? `#${quote.loadNumber}` : "Quote"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                QUOTE_STATUS_COLORS[quote.status]
              )}
            >
              {QUOTE_STATUS_LABELS[quote.status]}
            </span>
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className={cn(
                "p-1.5 rounded-full transition-colors cursor-pointer",
                isDark ? "hover:bg-slate-800 text-amber-400" : "hover:bg-slate-100 text-slate-600"
              )}
              title={isDark ? "Switch to daylight mode" : "Switch to night mode"}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Load summary */}
          <div className={cn("rounded-2xl border p-4", isDark ? "bg-[#1f1e24] border-slate-800" : "bg-white border-slate-200")}>
            <h2 className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-slate-400" : "text-slate-500")}>
              Shipment
            </h2>
            <div className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
              <LoadSummaryRow icon={MapPin} label="Lane" value={lane} isDark={isDark} />
              <LoadSummaryRow icon={Truck} label="Equipment" value={quote.equipmentType || "—"} isDark={isDark} />
              <LoadSummaryRow icon={Package} label="Commodity" value={quote.commodity || "—"} isDark={isDark} />
              <LoadSummaryRow
                icon={Scale}
                label="Weight"
                value={quote.weightLbs !== null ? `${quote.weightLbs.toLocaleString()} lbs` : "—"}
                isDark={isDark}
              />
              <LoadSummaryRow icon={Calendar} label="Pickup Date" value={formatDate(quote.pickupDate)} isDark={isDark} />
            </div>
          </div>

          {/* Rate + actions */}
          <div className={cn("rounded-2xl border p-5 text-center", isDark ? "bg-[#1f1e24] border-slate-800" : "bg-white border-slate-200")}>
            <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-slate-400" : "text-slate-500")}>
              Proposed Rate
            </p>
            <p className={cn("text-4xl font-extrabold tracking-tight mb-1", isDark ? "text-white" : "text-slate-900")}>
              {formatMoney(quote.proposedRate)}
            </p>
            {canRespond && (
              <p className={cn("text-xs mb-4", isDark ? "text-slate-500" : "text-slate-400")}>
                Quote expires {formatDate(quote.expiresAt)}
              </p>
            )}

            {statusMessage && (
              <div
                className={cn(
                  "mt-3 flex items-center justify-center gap-2 rounded-xl p-3 text-sm font-semibold",
                  isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"
                )}
              >
                <statusMessage.icon className="h-4 w-4 shrink-0" />
                <span>{statusMessage.text}</span>
              </div>
            )}

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-left text-xs font-medium text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {canRespond && (
              <div className="mt-4 space-y-2.5">
                <button
                  type="button"
                  onClick={() => respond("accept", null, null)}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm shadow-sm transition-all active:scale-[0.99] bg-emerald-600 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" />
                    Accept Rate ({formatMoney(quote.proposedRate)})
                  </span>
                </button>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCounterForm((v) => !v);
                      setShowDeclineConfirm(false);
                    }}
                    disabled={isSubmitting}
                    className={cn(
                      "flex-1 py-2.5 px-4 rounded-xl font-bold text-sm shadow-xs transition-all active:scale-[0.99] border disabled:cursor-not-allowed disabled:opacity-60",
                      isDark ? "border-slate-700 bg-[#18171d] text-slate-200 hover:bg-slate-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <Repeat2 className="h-4 w-4" />
                      Counter-Offer
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeclineConfirm((v) => !v);
                      setShowCounterForm(false);
                    }}
                    disabled={isSubmitting}
                    className={cn(
                      "flex-1 py-2.5 px-4 rounded-xl font-bold text-sm shadow-xs transition-all active:scale-[0.99] border disabled:cursor-not-allowed disabled:opacity-60",
                      isDark ? "border-rose-900 bg-[#18171d] text-rose-400 hover:bg-rose-950/40" : "border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                    )}
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <X className="h-4 w-4" />
                      Decline
                    </span>
                  </button>
                </div>

                {showDeclineConfirm && (
                  <div className={cn("rounded-xl border p-3 text-left", isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50")}>
                    <p className={cn("text-xs font-semibold mb-2", isDark ? "text-slate-200" : "text-slate-700")}>
                      Decline this quote? This can&apos;t be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => respond("decline", null, null)}
                        disabled={isSubmitting}
                        className="flex-1 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting ? "Declining..." : "Yes, Decline"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeclineConfirm(false)}
                        disabled={isSubmitting}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-bold border",
                          isDark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"
                        )}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {showCounterForm && (
                  <div className={cn("rounded-xl border p-3 space-y-2 text-left", isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50")}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={counterRateInput}
                      onChange={(e) => setCounterRateInput(e.target.value)}
                      placeholder="Your target rate, e.g. 1650.00"
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
                        isDark ? "border-slate-700 bg-[#18171d] text-white placeholder:text-slate-500" : "border-slate-200 bg-white"
                      )}
                    />
                    <input
                      type="text"
                      value={counterNote}
                      onChange={(e) => setCounterNote(e.target.value)}
                      placeholder="Note (optional)"
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
                        isDark ? "border-slate-700 bg-[#18171d] text-white placeholder:text-slate-500" : "border-slate-200 bg-white"
                      )}
                    />
                    <button
                      type="button"
                      onClick={handleCounterSubmit}
                      disabled={isSubmitting || !counterRateInput.trim()}
                      className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="inline-flex items-center justify-center gap-1.5">
                        <Send className="h-3.5 w-3.5" />
                        {isSubmitting ? "Sending..." : "Send Counter-Offer"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Negotiation history */}
          <div className={cn("rounded-2xl border p-4", isDark ? "bg-[#1f1e24] border-slate-800" : "bg-white border-slate-200")}>
            <h2 className={cn("text-xs font-bold uppercase tracking-wider mb-3", isDark ? "text-slate-400" : "text-slate-500")}>
              Negotiation History
            </h2>
            <NegotiationTimeline events={quote.events} viewerActorType="shipper" />
          </div>
        </div>
      </div>
    </div>
  );
}
