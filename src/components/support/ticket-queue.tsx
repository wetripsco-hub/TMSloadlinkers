"use client";

import { useMemo, useState, useTransition } from "react";
import { UserPlus, Loader2, Building2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/tailadmin/table";
import { Badge, type BadgeColor } from "@/components/ui/tailadmin/badge";
import { assignTicketToMe, updateTicketStatus } from "@/app/actions/tickets";
import { TicketThread, type TicketThreadMessage } from "@/components/support/ticket-thread";

export interface PlatformTicketRow {
  id: string;
  orgId: string;
  orgName: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  assignedTo: string | null;
  createdAt: string;
  messages: TicketThreadMessage[];
}

const STATUS_BADGE_COLOR: Record<string, BadgeColor> = {
  open: "info",
  in_progress: "warning",
  resolved: "success",
  closed: "light",
};

const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export function TicketQueue({ tickets }: { tickets: PlatformTicketRow[] }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });
  }, [tickets, statusFilter, priorityFilter]);

  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  const handleAssignToMe = (ticketId: string) => {
    startTransition(async () => {
      await assignTicketToMe(ticketId);
    });
  };

  const handleStatusChange = (ticketId: string, status: string) => {
    startTransition(async () => {
      await updateTicketStatus(ticketId, status as (typeof STATUSES)[number]);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="all">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <Table>
        <TableHeader>
          <tr>
            <TableCell isHeader>Organization</TableCell>
            <TableCell isHeader>Subject</TableCell>
            <TableCell isHeader>Priority</TableCell>
            <TableCell isHeader>Status</TableCell>
            <TableCell isHeader className="text-right">
              Actions
            </TableCell>
          </tr>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-slate-400">
                No tickets match your filters.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((ticket) => (
              <TableRow key={ticket.id} onClick={() => setSelectedId(ticket.id)}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-slate-900">{ticket.orgName}</span>
                    <span
                      title="Tenant Org UUID (click to select and copy)"
                      className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 select-all w-fit border border-slate-200/60"
                    >
                      {ticket.orgId}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{ticket.subject}</TableCell>
                <TableCell className="capitalize">{ticket.priority}</TableCell>
                <TableCell>
                  <select
                    value={ticket.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Badge color={STATUS_BADGE_COLOR[ticket.status] ?? "light"} size="sm" className="ml-2">
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignToMe(ticket.id);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline disabled:opacity-60"
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                    Assign to me
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {selected && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          {/* Persistent Top Banner showing Org Name + Org UUID */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-900">{selected.orgName}</span>
              <span
                title="Tenant Org UUID (click to select and copy)"
                className="font-mono text-xs bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700 select-all"
              >
                {selected.orgId}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>Ticket ID: {selected.id}</span>
            </div>
          </div>

          <div>
            <h3 className="mb-1 text-base font-semibold text-slate-900">{selected.subject}</h3>
            <p className="text-sm text-slate-600">{selected.description}</p>
          </div>
          <TicketThread ticketId={selected.id} messages={selected.messages} />
        </div>
      )}
    </div>
  );
}
