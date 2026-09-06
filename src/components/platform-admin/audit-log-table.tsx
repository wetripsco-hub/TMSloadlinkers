"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Info,
  User,
  Clock,
  ArrowRight,
  Code2,
} from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/tailadmin/table";
import { Badge, type BadgeColor } from "@/components/ui/tailadmin/badge";
import { formatDateTime } from "@/lib/format";

export interface PlatformAuditLogRow {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  action: string;
  orgId: string | null;
  orgName: string | null;
  beforeJson: Record<string, unknown> | null;
  afterJson: Record<string, unknown> | null;
  createdAt: string;
}

function getActionBadgeProps(action: string): { label: string; color: BadgeColor; icon: React.ReactNode } {
  switch (action) {
    case "data_reset_executed":
      return {
        label: "Data Reset Executed",
        color: "error",
        icon: <AlertTriangle className="h-3 w-3" />,
      };
    case "data_reset_rejected":
      return {
        label: "Data Reset Rejected",
        color: "warning",
        icon: <ShieldAlert className="h-3 w-3" />,
      };
    case "org_created":
    case "org_provisioned":
      return {
        label: "Org Provisioned",
        color: "success",
        icon: <CheckCircle2 className="h-3 w-3" />,
      };
    case "plan_updated":
    case "tier_changed":
      return {
        label: "Plan Changed",
        color: "info",
        icon: <Info className="h-3 w-3" />,
      };
    default:
      return {
        label: action.replace(/_/g, " "),
        color: "light",
        icon: <Info className="h-3 w-3" />,
      };
  }
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "null";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function KeyValueDiffInspector({
  before,
  after,
}: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  const [showRaw, setShowRaw] = useState(false);

  const allKeys = useMemo(() => {
    const keys = new Set<string>();
    if (before) Object.keys(before).forEach((k) => keys.add(k));
    if (after) Object.keys(after).forEach((k) => keys.add(k));
    return Array.from(keys);
  }, [before, after]);

  if (!before && !after) {
    return (
      <div className="py-2 text-xs italic text-slate-400">
        No state changes recorded for this audit entry.
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          State Changes &amp; Payload Inspector
        </span>
        <button
          type="button"
          onClick={() => setShowRaw(!showRaw)}
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <Code2 className="h-3.5 w-3.5" />
          {showRaw ? "Show Formatted Diff" : "Show Raw JSON"}
        </button>
      </div>

      {showRaw ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <div className="font-semibold text-slate-600 mb-1">Before State</div>
            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto max-h-60 font-mono text-[11px]">
              {before ? JSON.stringify(before, null, 2) : "null"}
            </pre>
          </div>
          <div>
            <div className="font-semibold text-slate-600 mb-1">After State</div>
            <pre className="p-3 bg-slate-900 text-indigo-300 rounded-lg overflow-x-auto max-h-60 font-mono text-[11px]">
              {after ? JSON.stringify(after, null, 2) : "null"}
            </pre>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {allKeys.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Empty payload object</p>
          ) : (
            allKeys.map((key) => {
              const beforeVal = before ? before[key] : undefined;
              const afterVal = after ? after[key] : undefined;

              const isAdded = beforeVal === undefined && afterVal !== undefined;
              const isRemoved = beforeVal !== undefined && afterVal === undefined;
              const isModified =
                beforeVal !== undefined &&
                afterVal !== undefined &&
                JSON.stringify(beforeVal) !== JSON.stringify(afterVal);
              const isUnchanged =
                beforeVal !== undefined &&
                afterVal !== undefined &&
                JSON.stringify(beforeVal) === JSON.stringify(afterVal);

              return (
                <div
                  key={key}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border text-xs ${
                    isAdded
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                      : isRemoved
                      ? "bg-rose-50/70 border-rose-200 text-rose-950"
                      : isModified
                      ? "bg-amber-50/70 border-amber-200 text-amber-950"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{key}</span>
                    {isAdded && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        Added
                      </span>
                    )}
                    {isRemoved && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
                        Removed
                      </span>
                    )}
                    {isModified && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                        Modified
                      </span>
                    )}
                    {isUnchanged && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                        Unchanged
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] overflow-x-auto max-w-full">
                    {beforeVal !== undefined && (
                      <span className={isModified || isRemoved ? "line-through text-rose-600 opacity-80" : ""}>
                        {formatValue(beforeVal)}
                      </span>
                    )}
                    {isModified && <ArrowRight className="h-3 w-3 text-amber-600 shrink-0" />}
                    {afterVal !== undefined && isModified && (
                      <span className="font-semibold text-emerald-700">{formatValue(afterVal)}</span>
                    )}
                    {isAdded && (
                      <span className="font-semibold text-emerald-700">{formatValue(afterVal)}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function PlatformAuditLogTable({ logs }: { logs: PlatformAuditLogRow[] }) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const actionOptions = useMemo(() => {
    const actions = new Set(logs.map((l) => l.action));
    return Array.from(actions);
  }, [logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const matchesSearch =
        !q ||
        (log.orgName && log.orgName.toLowerCase().includes(q)) ||
        (log.orgId && log.orgId.toLowerCase().includes(q)) ||
        (log.actorEmail && log.actorEmail.toLowerCase().includes(q)) ||
        (log.actorId && log.actorId.toLowerCase().includes(q)) ||
        log.action.toLowerCase().includes(q);

      return matchesAction && matchesSearch;
    });
  }, [logs, search, actionFilter]);

  const toggleExpand = (id: string) => {
    setExpandedRowId((curr) => (curr === id ? null : id));
  };

  return (
    <div className="space-y-4">
      {/* Search & Action Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by organization name, Org ID, or admin email..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="all">All actions</option>
          {actionOptions.map((act) => (
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>
      </div>

      {/* Audit Log Table */}
      <Table>
        <TableHeader>
          <tr>
            <TableCell isHeader className="w-10">
              <span className="sr-only">Expand</span>
            </TableCell>
            <TableCell isHeader>Timestamp</TableCell>
            <TableCell isHeader>Action</TableCell>
            <TableCell isHeader>Actor</TableCell>
            <TableCell isHeader>Target Organization</TableCell>
            <TableCell isHeader className="text-right">Inspection</TableCell>
          </tr>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-slate-400">
                No platform audit entries found matching your query.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((log) => {
              const isExpanded = expandedRowId === log.id;
              const badge = getActionBadgeProps(log.action);

              return (
                <React.Fragment key={log.id}>
                  <TableRow
                    onClick={() => toggleExpand(log.id)}
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    <TableCell className="text-slate-400 pl-3 pr-0">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-indigo-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium whitespace-nowrap">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDateTime(log.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge color={badge.color} size="sm" className="inline-flex items-center gap-1">
                        {badge.icon}
                        <span className="capitalize">{badge.label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-slate-800">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium truncate max-w-[180px]">
                          {log.actorEmail ?? log.actorName ?? "System"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.orgName ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-slate-900 text-xs">
                            {log.orgName}
                          </span>
                          {log.orgId && (
                            <span
                              title="Target Org UUID (click to select and copy)"
                              onClick={(e) => e.stopPropagation()}
                              className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 select-all w-fit border border-slate-200/60"
                            >
                              {log.orgId}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(log.id);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        {isExpanded ? "Collapse" : "Inspect"}
                      </button>
                    </TableCell>
                  </TableRow>

                  {/* Expandable Key-Value Diff Inspector */}
                  {isExpanded && (
                    <TableRow className="bg-slate-50/50">
                      <TableCell colSpan={6} className="p-4 pt-1">
                        <KeyValueDiffInspector
                          before={log.beforeJson}
                          after={log.afterJson}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default PlatformAuditLogTable;
