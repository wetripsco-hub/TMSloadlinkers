"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/tailadmin/table";
import { Badge, type BadgeColor } from "@/components/ui/tailadmin/badge";

export interface PlatformOrganizationRow {
  orgId: string;
  name: string;
  workspaceType: string;
  planTier: string | null;
  subscriptionState: string | null;
  seatCount: number;
  trialEndsAt: string | null;
  createdAt: string;
}

type SortKey = "name" | "planTier" | "subscriptionState" | "seatCount" | "createdAt";

const STATE_BADGE_COLOR: Record<string, BadgeColor> = {
  trialing: "info",
  active: "success",
  past_due: "warning",
  canceled: "error",
  expired: "error",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SortableHeader({
  label,
  sortKeyName,
  onToggle,
}: {
  label: string;
  sortKeyName: SortKey;
  onToggle: (key: SortKey) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(sortKeyName)}
      className="inline-flex items-center gap-1 hover:text-slate-900"
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );
}

export function OrgTable({ organizations }: { organizations: PlatformOrganizationRow[] }) {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const planOptions = useMemo(() => {
    const plans = new Set(organizations.map((o) => o.planTier).filter(Boolean) as string[]);
    return Array.from(plans);
  }, [organizations]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = organizations.filter((org) => {
      const matchesSearch = !query || org.name.toLowerCase().includes(query);
      const matchesPlan = planFilter === "all" || org.planTier === planFilter;
      return matchesSearch && matchesPlan;
    });

    const sorted = [...filtered].sort((a, b) => {
      let result = 0;
      switch (sortKey) {
        case "name":
          result = a.name.localeCompare(b.name);
          break;
        case "planTier":
          result = (a.planTier ?? "").localeCompare(b.planTier ?? "");
          break;
        case "subscriptionState":
          result = (a.subscriptionState ?? "").localeCompare(b.subscriptionState ?? "");
          break;
        case "seatCount":
          result = a.seatCount - b.seatCount;
          break;
        case "createdAt":
          result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === "asc" ? result : -result;
    });

    return sorted;
  }, [organizations, search, planFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="all">All plans</option>
          {planOptions.map((plan) => (
            <option key={plan} value={plan}>
              {plan}
            </option>
          ))}
        </select>
      </div>

      <Table>
        <TableHeader>
          <tr>
            <TableCell isHeader>
              <SortableHeader label="Organization" sortKeyName="name" onToggle={toggleSort} />
            </TableCell>
            <TableCell isHeader>Workspace type</TableCell>
            <TableCell isHeader>
              <SortableHeader label="Plan" sortKeyName="planTier" onToggle={toggleSort} />
            </TableCell>
            <TableCell isHeader>
              <SortableHeader label="Status" sortKeyName="subscriptionState" onToggle={toggleSort} />
            </TableCell>
            <TableCell isHeader>
              <SortableHeader label="Seats" sortKeyName="seatCount" onToggle={toggleSort} />
            </TableCell>
            <TableCell isHeader>Trial ends</TableCell>
            <TableCell isHeader>
              <SortableHeader label="Created" sortKeyName="createdAt" onToggle={toggleSort} />
            </TableCell>
          </tr>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-slate-400">
                No organizations match your filters.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((org) => (
              <TableRow key={org.orgId}>
                <TableCell className="font-semibold text-slate-900">{org.name}</TableCell>
                <TableCell>{org.workspaceType}</TableCell>
                <TableCell className="capitalize">{org.planTier ?? "—"}</TableCell>
                <TableCell>
                  {org.subscriptionState ? (
                    <Badge color={STATE_BADGE_COLOR[org.subscriptionState] ?? "light"} size="sm">
                      {org.subscriptionState}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{org.seatCount}</TableCell>
                <TableCell>{formatDate(org.trialEndsAt)}</TableCell>
                <TableCell>{formatDate(org.createdAt)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
