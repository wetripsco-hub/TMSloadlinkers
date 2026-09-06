import { History } from "lucide-react";
import type { AuditEvent } from "@/lib/repositories/audit";

const ACTION_LABELS: Record<AuditEvent["action"], string> = {
  insert: "Created Load",
  update: "Updated Load Details",
  delete: "Deleted Load",
};

const ACTION_BADGES: Record<AuditEvent["action"], string> = {
  insert: "bg-emerald-50 text-emerald-700 border-emerald-200",
  update: "bg-blue-50 text-blue-700 border-blue-200",
  delete: "bg-rose-50 text-rose-700 border-rose-200",
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function LoadAuditTrail({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-3 mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <History className="h-4 w-4 text-slate-400" />
          Audit Trail & Activity Log
        </h3>
      </div>

      <ul className="flex flex-col divide-y divide-slate-100">
        {events.map((event) => (
          <li key={event.id} className="flex items-center justify-between gap-3 py-2.5 text-xs">
            <div className="flex items-center gap-2.5">
              <span
                className={`inline-block px-2 py-0.5 rounded-md font-semibold border ${
                  ACTION_BADGES[event.action] || "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {ACTION_LABELS[event.action] || event.action}
              </span>
              <span className="text-slate-600">Audit log entry recorded</span>
            </div>
            <span className="text-slate-400 font-medium">{formatTimestamp(event.createdAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
