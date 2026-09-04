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
import { Search, Receipt, ArrowRight, Calendar } from "lucide-react";
import type { Invoice, Load } from "../../../types/domain";

const INVOICE_TYPE_LABELS: Record<Invoice["invoiceType"], string> = {
  shipper_invoice: "Shipper Invoice",
  carrier_settlement_voucher: "Carrier Settlement",
  dispatcher_carrier_commission: "Commission Voucher",
};

interface InvoiceTableProps {
  invoices: Invoice[];
  loadsById: Record<string, Load>;
}

export function InvoiceTable({ invoices, loadsById }: InvoiceTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== "ALL" && inv.status !== statusFilter) {
        return false;
      }
      if (typeFilter !== "ALL" && inv.invoiceType !== typeFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const num = (inv.invoiceNumber || inv.id).toLowerCase();
        const loadNum = inv.loadId ? (loadsById[inv.loadId]?.loadNumber || inv.loadId).toLowerCase() : "";
        const billTo = (inv.billToName || "").toLowerCase();

        if (!num.includes(q) && !loadNum.includes(q) && !billTo.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, loadsById, statusFilter, typeFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="w-full sm:max-w-xs">
            <TailAdminInput
              placeholder="Search invoice #, load #, billing..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startIcon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="w-40">
            <TailAdminSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "paid", label: "Paid" },
                { value: "unpaid", label: "Unpaid / Due" },
                { value: "partially_paid", label: "Partial" },
                { value: "void", label: "Void" },
              ]}
            />
          </div>

          <div className="w-44">
            <TailAdminSelect
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: "ALL", label: "All Types" },
                { value: "shipper_invoice", label: "Shipper Invoices" },
                { value: "carrier_settlement_voucher", label: "Carrier Settlements" },
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          <span>Showing</span>
          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-bold text-gray-800 dark:bg-white/10 dark:text-white">
            {filteredInvoices.length}
          </span>
          <span>of {invoices.length} invoices</span>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-800 dark:bg-[#18171d]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-gray-800">
            <Receipt className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
            No invoices found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL"
              ? "Try adjusting your search criteria or invoice filters."
              : "Generate an invoice from delivered loads to initiate billing."}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableCell isHeader>Invoice #</TableCell>
              <TableCell isHeader>Category</TableCell>
              <TableCell isHeader>Payment Status</TableCell>
              <TableCell isHeader>Linked Load</TableCell>
              <TableCell isHeader>Due Date</TableCell>
              <TableCell isHeader className="text-right">Total</TableCell>
              <TableCell isHeader className="text-right">Paid</TableCell>
              <TableCell isHeader className="text-right">Balance Due</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => {
              const load = invoice.loadId ? loadsById[invoice.loadId] : undefined;
              const formattedInvNum =
                invoice.invoiceNumber || `INV-${invoice.id.slice(0, 6).toUpperCase()}`;

              return (
                <TableRow key={invoice.id}>
                  {/* Invoice # */}
                  <TableCell>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formattedInvNum}
                    </span>
                  </TableCell>

                  {/* Type */}
                  <TableCell className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium dark:bg-white/5">
                      {INVOICE_TYPE_LABELS[invoice.invoiceType]}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <InvoiceStatusBadge status={invoice.status} />
                  </TableCell>

                  {/* Load ID */}
                  <TableCell>
                    {invoice.loadId ? (
                      <Link
                        href={`/loads/${invoice.loadId}`}
                        className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline dark:text-brand-400"
                      >
                        {load?.loadNumber || `LD-${invoice.loadId.slice(0, 6).toUpperCase()}`}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-gray-400 italic">Unlinked</span>
                    )}
                  </TableCell>

                  {/* Due Date */}
                  <TableCell className="text-xs text-gray-600 dark:text-gray-400">
                    {invoice.dueDate ? (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {new Date(invoice.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Net 30</span>
                    )}
                  </TableCell>

                  {/* Total */}
                  <TableCell className="text-right font-medium text-gray-900 dark:text-white tabular-nums">
                    {formatCents(invoice.amountTotal)}
                  </TableCell>

                  {/* Paid */}
                  <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                    {formatCents(invoice.amountPaid)}
                  </TableCell>

                  {/* Due */}
                  <TableCell className="text-right font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatCents(invoice.amountDue)}
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

export default InvoiceTable;
