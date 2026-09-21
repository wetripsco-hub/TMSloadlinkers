import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Truck, User } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/format";
import { listMessageThreads } from "@/lib/repositories/load-notes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Messages | FreightLink TMS",
};

const PREVIEW_MAX_LENGTH = 80;

function truncatePreview(text: string): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > PREVIEW_MAX_LENGTH
    ? `${collapsed.slice(0, PREVIEW_MAX_LENGTH).trimEnd()}…`
    : collapsed;
}

export default async function MessagesPage() {
  const threads = await listMessageThreads();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        subtitle="Driver updates and dispatch replies, across every load you can see."
        breadcrumbs={[{ label: "Messages" }]}
      />

      {threads.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="Driver check-in notes and dispatch replies will show up here as loads move."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {threads.map((thread) => {
              const loadLabel = thread.loadNumber || `LD-${thread.loadId.slice(0, 6).toUpperCase()}`;

              return (
                <li key={thread.loadId}>
                  <Link
                    href={`/loads/${thread.loadId}#load-notes-panel`}
                    className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50/70"
                  >
                    {thread.isUnread ? (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-amber-500"
                        title="Unread driver message"
                      />
                    ) : (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-transparent" aria-hidden />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`text-sm ${
                            thread.isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-800"
                          }`}
                        >
                          {loadLabel}
                        </span>
                        <span className="shrink-0 text-xs text-slate-400">
                          {formatRelativeTime(thread.lastMessageCreatedAt)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1 shrink-0 text-xs font-medium text-slate-400">
                          {thread.lastMessageAuthorType === "driver" ? (
                            <Truck className="h-3 w-3" />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                          {thread.lastMessageAuthorLabel}:
                        </span>
                        <span className="truncate">{truncatePreview(thread.lastMessageText)}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
