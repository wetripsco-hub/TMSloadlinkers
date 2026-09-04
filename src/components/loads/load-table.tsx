"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatCents } from "@/lib/money";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/tailadmin/table";
import {
  TailAdminInput,
  TailAdminSelect,
} from "@/components/ui/tailadmin/form-elements";
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
}

type SortField = "date" | "rate" | "margin" | "number";
type SortOrder = "asc" | "desc";

export function LoadTable({ loads, customers, carriers, initialStatus }: LoadTableProps) {
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
        if (statusFilter === "OPEN") {
          if (load.status === "cancelled" || load.status === "settled") {
            return false;
          }
        } else if (statusFilter !== "ALL" && load.status !== statusFilter) {
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
          <div className="w-full sm:max-w-xs">
            <TailAdminInput
              placeholder="Search by load #, customer, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startIcon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="w-44">
            <TailAdminSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "OPEN", label: "Open (Active Pipeline)" },
                { value: "quoted", label: "Quoted" },
                { value: "posted_to_boards", label: "Posted" },
                { value: "covered", label: "Covered" },
                { value: "dispatched", label: "Dispatched" },
                { value: "in_transit", label: "In Transit" },
                { value: "delivered", label: "Delivered" },
                { value: "pod_uploaded", label: "POD Uploaded" },
                { value: "invoiced", label: "Invoiced" },
                { value: "settled", label: "Settled" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
          </div>
        </div>

        {/* Total counts badge */}
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          <span>Showing</span>
          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-bold text-gray-800 dark:bg-white/10 dark:text-white">
            {filteredAndSortedLoads.length}
          </span>
          <span>of {loads.length} loads</span>
        </div>
      </div>

      {/* Main Table */}
      {filteredAndSortedLoads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-800 dark:bg-[#18171d]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-gray-800">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
            No loads found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== "ALL"
              ? "Try adjusting your search query or status filter."
              : "Create your first load to begin dispatch operations."}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableCell isHeader>
                <button
                  type="button"
                  onClick={() => toggleSort("number")}
                  className="flex items-center gap-1.5 hover:text-brand-500 transition-colors"
                >
                  Load #
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableCell>
              <TableCell isHeader>Customer</TableCell>
              <TableCell isHeader>Carrier</TableCell>
              <TableCell isHeader>Equipment</TableCell>
              <TableCell isHeader>Origin → Destination</TableCell>
              <TableCell isHeader>
                <button
                  type="button"
                  onClick={() => toggleSort("rate")}
                  className="flex items-center gap-1.5 hover:text-brand-500 transition-colors"
                >
                  Rate
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableCell>
              <TableCell isHeader>
                <button
                  type="button"
                  onClick={() => toggleSort("margin")}
                  className="flex items-center gap-1.5 hover:text-brand-500 transition-colors"
                >
                  Margin
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableCell>
              <TableCell isHeader>Status</TableCell>
              <TableCell isHeader className="text-right">Actions</TableCell>
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
                <TableRow key={load.id}>
                  {/* Load # */}
                  <TableCell>
                    <Link
                      href={`/loads/${load.id}`}
                      className="font-semibold text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400"
                    >
                      {formattedLoadNum}
                    </Link>
                  </TableCell>

                  {/* Customer */}
                  <TableCell className="font-medium text-gray-900 dark:text-white">
                    {customerName}
                  </TableCell>

                  {/* Carrier */}
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 ${
                        load.carrierId
                          ? "text-gray-800 dark:text-gray-200"
                          : "italic text-amber-600 dark:text-amber-400 font-normal"
                      }`}
                    >
                      {carrierName}
                    </span>
                  </TableCell>

                  {/* Equipment */}
                  <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                    {load.equipmentType || "53' Dry Van"}
                  </TableCell>

                  {/* Origin -> Destination */}
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {load.origin?.address || "Pending Origin"}
                      </span>
                      <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {load.destination?.address || "Pending Dest"}
                      </span>
                    </div>
                  </TableCell>

                  {/* Rate */}
                  <TableCell className="font-semibold text-gray-900 dark:text-white tabular-nums">
                    {formatCents(load.shipperRate)}
                  </TableCell>

                  {/* Margin */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 tabular-nums">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCents(load.brokerMargin)}
                      </span>
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        {marginPercentage}%
                      </span>
                    </div>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell>
                    <LoadStatusBadge status={load.status} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
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
                            className={`flex h-8 items-center gap-1.5 px-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                              load.carrierId
                                ? "border-brand-200 bg-brand-50/70 text-brand-700 hover:bg-brand-100 dark:border-brand-900/60 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 shadow-xs"
                                : "border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/5 dark:text-gray-500"
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
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {load.trackingToken && (
                        <Link
                          href={`/track?token=${load.trackingToken}`}
                          title="Driver Live Tracking"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 dark:border-sky-800/60 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20 transition-colors"
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
