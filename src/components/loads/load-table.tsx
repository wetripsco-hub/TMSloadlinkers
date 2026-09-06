"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatMoney, formatDate } from "@/lib/format";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/tailadmin/table";

import {
  Search,
  ArrowRight,
  ArrowUpDown,
  Package,
  Eye,
  Navigation,
  FileText,
} from "lucide-react";
import { RateConfirmationModal } from "@/components/documents/rate-confirmation-modal";
import type { Load } from "../../../types/domain";
import type { CustomerRecord } from "@/lib/repositories/customers";
import type { CarrierRecord } from "@/lib/repositories/carriers";

interface LoadTableProps {
  loads: Load[];
  customers: CustomerRecord[];
  carriers: CarrierRecord[];
  initialStatus?: string;
  onCreateLoad?: () => void;
}

type SortField = "date" | "rate" | "margin" | "number";
type SortOrder = "asc" | "desc";

export function LoadTable({ loads, customers, carriers, initialStatus, onCreateLoad }: LoadTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus ?? "ALL");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Create fast lookup maps for customers and carriers
  const customersById = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [customers]);

  const carriersById = useMemo(() => {
    const map = new Map<string, string>();
    carriers.forEach((c) => map.set(c.id, c.companyName));
    return map;
  }, [carriers]);

  // Filtering and sorting
  const filteredAndSortedLoads = useMemo(() => {
    return loads
      .filter((load) => {
        // Status filter
        const filterKey = statusFilter.toLowerCase();
        if (filterKey === "open" || filterKey === "active") {
          if (load.status === "cancelled" || load.status === "settled") {
            return false;
          }
        } else if (statusFilter !== "ALL" && filterKey !== "all" && load.status !== statusFilter && load.status.toLowerCase() !== filterKey) {
          return false;
        }

        // Search term filter
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const loadNum = (load.loadNumber || load.id.slice(0, 8)).toLowerCase();
          const customerName = (load.customerId ? customersById.get(load.customerId) || "" : "").toLowerCase();
          const carrierName = (load.carrierId ? carriersById.get(load.carrierId) || "" : "").toLowerCase();
          const origin = (load.origin?.address || "").toLowerCase();
          const destination = (load.destination?.address || "").toLowerCase();

          const matches =
            loadNum.includes(query) ||
            customerName.includes(query) ||
            carrierName.includes(query) ||
            origin.includes(query) ||
            destination.includes(query);

          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === "date") {
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortField === "rate") {
          comparison = (b.shipperRate || 0) - (a.shipperRate || 0);
        } else if (sortField === "margin") {
          comparison = (b.brokerMargin || 0) - (a.brokerMargin || 0);
        } else if (sortField === "number") {
          const numA = a.loadNumber || a.id;
          const numB = b.loadNumber || b.id;
          comparison = numA.localeCompare(numB);
        }

        return sortOrder === "asc" ? -comparison : comparison;
      });
  }, [loads, customersById, carriersById, statusFilter, searchTerm, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search by load #, customer, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full pl-9 pr-3.5 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            />
          </div>

          <div className="w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full px-3 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open (Active Pipeline)</option>
              <option value="quoted">Quoted</option>
              <option value="posted_to_boards">Posted</option>
              <option value="covered">Covered</option>
              <option value="dispatched">Dispatched</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="pod_uploaded">POD Uploaded</option>
              <option value="invoiced">Invoiced</option>
              <option value="settled">Settled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Total counts badge */}
        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredAndSortedLoads.length} of {loads.length} loads
        </div>
      </div>

      {/* Main Table */}
      {filteredAndSortedLoads.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No loads found"
          description={
            searchTerm || statusFilter !== "ALL"
              ? "Try adjusting your search query or status filter."
              : "Create a new shipment to start tracking rates, assigning carriers, and dispatching."
          }
          action={
            onCreateLoad
              ? {
                  label: "Create Load",
                  onClick: onCreateLoad,
                }
              : undefined
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <tr className="border-y border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider py-3.5 px-4">
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">
                <button
                  type="button"
                  onClick={() => toggleSort("number")}
                  className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                >
                  Load #
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Customer</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Carrier</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Equipment</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Origin → Destination</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort("rate")}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors ml-auto"
                >
                  Rate
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort("margin")}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors ml-auto"
                >
                  Margin
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Status</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600 text-right">Actions</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredAndSortedLoads.map((load) => {
              const customerName = load.customerId
                ? customersById.get(load.customerId) || "Account #" + load.customerId.slice(0, 6)
                : "Spot Customer";
              const carrierName = load.carrierId
                ? carriersById.get(load.carrierId) || "Carrier #" + load.carrierId.slice(0, 6)
                : "Needs Carrier";

              const marginPercentage =
                load.shipperRate > 0
                  ? ((load.brokerMargin / load.shipperRate) * 100).toFixed(1)
                  : "0.0";

              const formattedLoadNum = load.loadNumber || `LD-${load.id.slice(0, 6).toUpperCase()}`;

              return (
                <TableRow key={load.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Load # */}
                  <TableCell className="py-3.5 px-4">
                    <Link
                      href={`/loads/${load.id}`}
                      className="font-semibold text-blue-600 hover:text-blue-700 text-sm transition-colors"
                    >
                      {formattedLoadNum}
                    </Link>
                  </TableCell>

                  {/* Customer */}
                  <TableCell className="py-3.5 px-4 font-semibold text-slate-900 text-sm">
                    {customerName}
                  </TableCell>

                  {/* Carrier */}
                  <TableCell className="py-3.5 px-4 text-sm">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        load.carrierId
                          ? "text-slate-600"
                          : "italic text-amber-600 font-normal"
                      }`}
                    >
                      {carrierName}
                    </span>
                  </TableCell>

                  {/* Equipment */}
                  <TableCell className="py-3.5 px-4 text-sm text-slate-600">
                    {load.equipmentType || "53' Dry Van"}
                  </TableCell>

                  {/* Origin -> Destination */}
                  <TableCell className="py-3.5 px-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="font-medium text-slate-800">
                        {load.origin?.address || "Pending Origin"}
                      </span>
                      <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800">
                        {load.destination?.address || "Pending Dest"}
                      </span>
                    </div>
                    {(load.origin?.windowStart || load.destination?.windowStart) && (
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        {load.origin?.windowStart ? formatDate(load.origin.windowStart) : "—"} →{" "}
                        {load.destination?.windowStart ? formatDate(load.destination.windowStart) : "—"}
                      </div>
                    )}
                  </TableCell>

                  {/* Rate */}
                  <TableCell className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 text-sm">
                    {formatMoney(load.shipperRate)}
                  </TableCell>

                  {/* Margin */}
                  <TableCell className="py-3.5 px-4 text-right font-mono tabular-nums">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="font-semibold text-emerald-700 text-sm">
                        {formatMoney(load.brokerMargin)}
                      </span>
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {marginPercentage}%
                      </span>
                    </div>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="py-3.5 px-4">
                    <LoadStatusBadge status={load.status} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Rate Confirmation Modal Action */}
                      <RateConfirmationModal
                        load={load}
                        carrier={load.carrierId ? carriers.find((c) => c.id === load.carrierId) : null}
                        customer={load.customerId ? customers.find((c) => c.id === load.customerId) : null}
                        triggerButton={
                          <button
                            type="button"
                            title="Generate Rate Con"
                            className={`flex h-8 items-center gap-1.5 px-2.5 rounded-lg border text-xs font-medium transition-colors ${
                              load.carrierId
                                ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
                                : "border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100"
                            }`}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span className="hidden lg:inline">Generate Rate Con</span>
                          </button>
                        }
                      />

                      <Link
                        href={`/loads/${load.id}`}
                        title="View Load Details"
                        aria-label="View Load Details"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {load.trackingToken && (
                        <Link
                          href={`/track?token=${load.trackingToken}`}
                          title="Driver Live Tracking"
                          aria-label="Driver Live Tracking"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export default LoadTable;
