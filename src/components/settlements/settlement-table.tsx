"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { SettlementStatusBadge } from "@/components/settlements/settlement-status-badge";
import { formatMoney, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/tailadmin/table";
import { Search, Truck, ArrowRight, Calendar } from "lucide-react";
import type { Invoice, Load } from "../../../types/domain";
import type { CarrierRecord } from "@/lib/repositories/carriers";

interface SettlementTableProps {
  settlements: Invoice[];
  loadsById: Record<string, Load>;
  carriersById: Record<string, CarrierRecord>;
}

export function SettlementTable({
  settlements,
  loadsById,
  carriersById,
}: SettlementTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredSettlements = useMemo(() => {
    return settlements.filter((inv) => {
      if (statusFilter !== "ALL" && inv.status !== statusFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const load = inv.loadId ? loadsById[inv.loadId] : undefined;
        const carrier = load?.carrierId ? carriersById[load.carrierId] : undefined;

        const num = (inv.invoiceNumber || inv.id).toLowerCase();
        const loadNum = (load?.loadNumber || inv.loadId || "").toLowerCase();
        const carrierName = (carrier?.companyName || "").toLowerCase();

        if (!num.includes(q) && !loadNum.includes(q) && !carrierName.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [settlements, loadsById, carriersById, statusFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search voucher #, carrier, load..."
              aria-label="Search settlements by voucher, carrier, or load"
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
              <option value="paid">Paid</option>
              <option value="unpaid">Ready for Payment</option>
              <option value="partially_paid">Partial</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredSettlements.length} of {settlements.length} vouchers
        </div>
      </div>

      {filteredSettlements.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No carrier settlements found"
          description={
            searchTerm || statusFilter !== "ALL"
              ? "No settlement matches your search criteria or filter. Try adjusting your search."
              : "Approved carrier payables will populate here once proof of delivery is verified."
          }
          action={{
            label: "Review Loads",
            href: "/loads",
          }}
        />
      ) : (
        <Table>
          <TableHeader>
            <tr className="border-y border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider py-3.5 px-4">
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Voucher #</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Carrier</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Load Reference</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Status</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600 text-right">Carrier Pay Amount</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Date Issued</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredSettlements.map((invoice) => {
              const load = invoice.loadId ? loadsById[invoice.loadId] : undefined;
              const carrier = load?.carrierId ? carriersById[load.carrierId] : undefined;
              const formattedVoucherNum =
                invoice.invoiceNumber || `SET-${invoice.id.slice(0, 6).toUpperCase()}`;

              return (
                <TableRow key={invoice.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Voucher # */}
                  <TableCell className="py-3.5 px-4 font-semibold text-slate-900 text-sm">
                    {formattedVoucherNum}
                  </TableCell>

                  {/* Carrier */}
                  <TableCell className="py-3.5 px-4 font-medium text-slate-800 text-sm">
                    {carrier?.companyName || "Unassigned Carrier"}
                  </TableCell>

                  {/* Load Ref */}
                  <TableCell className="py-3.5 px-4">
                    {invoice.loadId ? (
                      <Link
                        href={`/loads/${invoice.loadId}`}
                        className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700 text-xs transition-colors"
                      >
                        <span>{load?.loadNumber || `LD-${invoice.loadId.slice(0, 6).toUpperCase()}`}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Unlinked</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3.5 px-4">
                    <SettlementStatusBadge status={invoice.status} />
                  </TableCell>

                  {/* Carrier Pay Amount */}
                  <TableCell className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 text-sm tabular-nums">
                    {formatMoney(invoice.amountTotal)}
                  </TableCell>

                  {/* Date Issued */}
                  <TableCell className="py-3.5 px-4 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formatDate(invoice.issueDate)}</span>
                    </span>
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

export default SettlementTable;
