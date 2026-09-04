"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { formatCents } from "@/lib/money";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/tailadmin/table";
import { TailAdminInput, TailAdminSelect } from "@/components/ui/tailadmin/form-elements";
import { Search, Landmark, ArrowRight, Calendar } from "lucide-react";
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
          <div className="w-full sm:max-w-xs">
            <TailAdminInput
              placeholder="Search voucher #, carrier, load..."
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
                { value: "paid", label: "Paid" },
                { value: "unpaid", label: "Pending Payout" },
                { value: "partially_paid", label: "Partial" },
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          <span>Showing</span>
          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-bold text-gray-800 dark:bg-white/10 dark:text-white">
            {filteredSettlements.length}
          </span>
          <span>of {settlements.length} vouchers</span>
        </div>
      </div>

      {filteredSettlements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-800 dark:bg-[#18171d]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-gray-800">
            <Landmark className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
            No settlements found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== "ALL"
              ? "Try adjusting your search criteria."
              : "Generate carrier pay vouchers from completed loads."}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableCell isHeader>Voucher #</TableCell>
              <TableCell isHeader>Carrier</TableCell>
              <TableCell isHeader>Load Reference</TableCell>
              <TableCell isHeader>Status</TableCell>
              <TableCell isHeader className="text-right">Carrier Pay Amount</TableCell>
              <TableCell isHeader>Date Issued</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredSettlements.map((invoice) => {
              const load = invoice.loadId ? loadsById[invoice.loadId] : undefined;
              const carrier = load?.carrierId ? carriersById[load.carrierId] : undefined;
              const formattedVoucherNum =
                invoice.invoiceNumber || `SET-${invoice.id.slice(0, 6).toUpperCase()}`;

              return (
                <TableRow key={invoice.id}>
                  {/* Voucher # */}
                  <TableCell className="font-semibold text-gray-900 dark:text-white">
                    {formattedVoucherNum}
                  </TableCell>

                  {/* Carrier */}
                  <TableCell className="font-medium text-gray-800 dark:text-gray-200">
                    {carrier?.companyName || "Unassigned Carrier"}
                  </TableCell>

                  {/* Load Ref */}
                  <TableCell>
                    {invoice.loadId ? (
                      <Link
                        href={`/loads/${invoice.loadId}`}
                        className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline dark:text-brand-400 text-xs"
                      >
                        {load?.loadNumber || `LD-${invoice.loadId.slice(0, 6).toUpperCase()}`}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Unlinked</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <InvoiceStatusBadge status={invoice.status} />
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="text-right font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatCents(invoice.amountTotal)}
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {new Date(invoice.issueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
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
