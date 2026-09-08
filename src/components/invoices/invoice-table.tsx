"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { InvoiceModal } from "@/components/invoices/invoice-modal";
import { formatMoney, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/tailadmin/table";
import { Search, Receipt, ArrowRight, Calendar, Printer, ExternalLink } from "lucide-react";
import type { Invoice, Load, Organization } from "../../../types/domain";

const INVOICE_TYPE_LABELS: Record<Invoice["invoiceType"], string> = {
  shipper_invoice: "Shipper Invoice",
  carrier_settlement_voucher: "Carrier Settlement",
  dispatcher_carrier_commission: "Commission Voucher",
};

interface InvoiceTableProps {
  invoices: Invoice[];
  loadsById: Record<string, Load>;
  organization?: Organization | null;
}

export function InvoiceTable({ invoices, loadsById, organization }: InvoiceTableProps) {
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
          <div className="relative w-full sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search invoice #, load #, billing..."
              aria-label="Search invoices by number, load, or billing"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full pl-9 pr-3.5 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            />
          </div>

          <div className="w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full px-3 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid / Due</option>
              <option value="partially_paid">Partial</option>
              <option value="void">Void</option>
            </select>
          </div>

          <div className="w-44">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 w-full px-3 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            >
              <option value="ALL">All Types</option>
              <option value="shipper_invoice">Shipper Invoices</option>
              <option value="carrier_settlement_voucher">Carrier Settlements</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredInvoices.length} of {invoices.length} invoices
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices generated yet"
          description={
            searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL"
              ? "No invoice matches your search criteria or invoice filters. Try adjusting your search."
              : "Delivered shipments ready for customer billing will automatically appear here."
          }
          action={{
            label: "View Delivered Loads",
            href: "/loads?status=delivered",
          }}
        />
      ) : (
        <Table>
          <TableHeader>
            <tr className="border-y border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider py-3.5 px-4">
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Invoice #</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Category</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Payment Status</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Linked Load</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Due Date</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-right">Total Amount</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-right">Paid Amount</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-right">Balance Due</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-right">Actions</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => {
              const load = invoice.loadId ? loadsById[invoice.loadId] : undefined;
              const formattedInvNum =
                invoice.invoiceNumber || `INV-${invoice.id.slice(0, 6).toUpperCase()}`;

              return (
                <TableRow key={invoice.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Invoice # */}
                  <TableCell className="py-3.5 px-4">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="font-semibold text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1 group transition-colors"
                      title="View & Print Invoice"
                    >
                      <span className="group-hover:underline">{formattedInvNum}</span>
                    </Link>
                  </TableCell>

                  {/* Type */}
                  <TableCell className="py-3.5 px-4 text-xs text-slate-600">
                    <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 font-medium">
                      {INVOICE_TYPE_LABELS[invoice.invoiceType]}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3.5 px-4">
                    <InvoiceStatusBadge status={invoice.status} />
                  </TableCell>

                  {/* Load ID */}
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

                  {/* Due Date */}
                  <TableCell className="py-3.5 px-4 text-sm text-slate-600">
                    {invoice.dueDate ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDate(invoice.dueDate)}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">{"—"}</span>
                    )}
                  </TableCell>

                  {/* Total Amount */}
                  <TableCell className="py-3.5 px-4 text-right font-mono font-medium text-slate-900 text-sm tabular-nums">
                    {formatMoney(invoice.amountTotal)}
                  </TableCell>

                  {/* Paid Amount */}
                  <TableCell className="py-3.5 px-4 text-right font-mono text-emerald-700 font-medium text-sm tabular-nums">
                    {formatMoney(invoice.amountPaid)}
                  </TableCell>

                  {/* Balance Due */}
                  <TableCell className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 text-sm tabular-nums">
                    {formatMoney(invoice.amountDue)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <InvoiceModal
                        invoice={invoice}
                        load={load}
                        organization={organization}
                        triggerButton={
                          <button
                            type="button"
                            title="Print or Save PDF"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
                          >
                            <Printer className="h-3.5 w-3.5 text-blue-600" />
                            <span className="hidden sm:inline">Print / PDF</span>
                          </button>
                        }
                      />
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        title="Open full page view"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
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

export default InvoiceTable;
