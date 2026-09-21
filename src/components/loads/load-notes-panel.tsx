"use client";

import { useEffect, useState } from "react";
import { Truck, User, Send } from "lucide-react";

import { formatDateTime } from "@/lib/format";
import { addLoadNote, listLoadNotes, markLoadNotesRead } from "@/app/(dashboard)/loads/[id]/actions";
import type { LoadNote, UUID } from "../../../types/domain";

export function LoadNotesPanel({
  loadId,
  initialNotes,
}: {
  loadId: UUID;
  initialNotes: LoadNote[];
}) {
  const [notes, setNotes] = useState<LoadNote[]>(initialNotes);
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mount-only mark-read missed the case where the page is already open
  // when a new driver note arrives (confirmed live: a note stayed
  // is_read=false even though staff replied to it in the same session,
  // because nothing ever re-checked after the initial mount). Polling on an
  // interval is the simplest fix given this panel's structure -- it's a
  // single always-visible component with no scroll container or focus
  // event to hook into, and it already has a fetch-then-mark-read code
  // path from the old mount effect, so this just runs that same path
  // periodically instead of once. 15s matches the cadence used for the
  // driver-side thread polling (track/[token]).
  useEffect(() => {
    let cancelled = false;

    async function syncNotes() {
      try {
        const fresh = await listLoadNotes(loadId);
        if (cancelled) return;

        if (fresh.some((note) => note.authorType === "driver" && !note.isRead)) {
          await markLoadNotesRead(loadId);
          if (cancelled) return;
          setNotes(await listLoadNotes(loadId));
        } else {
          setNotes(fresh);
        }
      } catch {
        // Best-effort -- the unread dot on the loads table will just clear
        // on the next successful sync or full page load instead.
      }
    }

    syncNotes();
    const interval = setInterval(syncNotes, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [loadId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const note = await addLoadNote(loadId, trimmed);
      setNotes((prev) => [...prev, note]);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add note");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      id="load-notes-panel"
      className="flex h-full flex-col rounded-xl border border-slate-200/80 bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 px-4 py-3.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Notes</h3>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3.5 max-h-[420px]">
        {notes.length === 0 ? (
          <p className="text-sm text-slate-400">No notes yet.</p>
        ) : (
          notes.map((note) => {
            const isDriver = note.authorType === "driver";
            return (
              <div
                key={note.id}
                className={`rounded-lg border p-2.5 text-sm ${
                  isDriver
                    ? "border-amber-200 bg-amber-50/70"
                    : "border-slate-200 bg-slate-50/70"
                }`}
              >
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
                  {isDriver ? (
                    <Truck className="h-3.5 w-3.5 text-amber-600" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-slate-500" />
                  )}
                  <span className={isDriver ? "text-amber-800" : "text-slate-700"}>
                    {note.authorLabel}
                  </span>
                  <span className="font-normal text-slate-400">
                    {formatDateTime(note.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-slate-700">{note.noteText}</p>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-100 p-3">
        {error && <p className="mb-2 text-xs text-rose-600">{error}</p>}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            placeholder="Add a note..."
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isSubmitting || !draft.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
