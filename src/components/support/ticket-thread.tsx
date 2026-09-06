"use client";

import { useState, useTransition } from "react";
import { Send, Loader2 } from "lucide-react";
import { replyToTicket } from "@/app/actions/tickets";
import { formatDateTime } from "@/lib/format";

export interface TicketThreadMessage {
  id: string;
  senderType: "tenant" | "platform_admin";
  message: string;
  createdAt: string;
}

export function TicketThread({
  ticketId,
  messages,
}: {
  ticketId: string;
  messages: TicketThreadMessage[];
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;

    setError(null);
    startTransition(async () => {
      try {
        await replyToTicket(ticketId, draft);
        setDraft("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send reply");
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400">No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg border px-3 py-2 text-sm ${
                msg.senderType === "platform_admin"
                  ? "border-blue-200 bg-blue-50/60 text-blue-900"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
                <span>{msg.senderType === "platform_admin" ? "Loadlinkers Support" : "You"}</span>
                <span>{formatDateTime(msg.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap">{msg.message}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a reply..."
          rows={2}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isPending || !draft.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Reply
        </button>
      </form>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
