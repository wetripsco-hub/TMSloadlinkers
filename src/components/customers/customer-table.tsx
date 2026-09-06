"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/tailadmin/table";
import { Search, Building2, Mail, Phone, MapPin, Package, ArrowRight, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import { AddCustomerModal } from "@/components/customers/add-customer-modal";
import type { CustomerRecord } from "@/lib/repositories/customers";

export interface CustomerTableProps {
  customers: CustomerRecord[];
  activeLoadsCountByCustomer: Record<string, number>;
  onAddCustomer?: () => void;
}

export function CustomerTable({
  customers,
  activeLoadsCountByCustomer,
  onAddCustomer,
}: CustomerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddCustomer = onAddCustomer || (() => setIsAddModalOpen(true));

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;

    const q = searchTerm.toLowerCase();
    return customers.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const matchEmail = (c.email || "").toLowerCase().includes(q);
      const matchAddress = (c.billingAddress || "").toLowerCase().includes(q);
      const matchPhone = (c.phone || "").toLowerCase().includes(q);
      return matchName || matchEmail || matchAddress || matchPhone;
    });
  }, [customers, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search shippers by name, email, address..."
            aria-label="Search shippers by name, email, or address"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full pl-9 pr-3.5 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredCustomers.length} of {customers.length} shippers
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No shipper accounts found"
          description={
            searchTerm
              ? "No customer matches your search term. Try adjusting your query."
              : "Add your first commercial shipper to start booking freight loads and invoicing."
          }
          action={{
            label: "New Customer",
            onClick: handleAddCustomer,
          }}
        />
      ) : (
        <Table>
          <TableHeader>
            <tr className="border-y border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider py-3.5 px-4">
              <TableCell isHeader className="border-y border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider py-3.5 px-4">
                Shipper / Customer
              </TableCell>
              <TableCell isHeader className="border-y border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider py-3.5 px-4">
                Billing Contact
              </TableCell>
              <TableCell isHeader className="border-y border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider py-3.5 px-4">
                Billing Address
              </TableCell>
              <TableCell isHeader className="border-y border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider py-3.5 px-4">
                Active Loads
              </TableCell>
              <TableCell isHeader className="border-y border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider py-3.5 px-4">
                Created On
              </TableCell>
              <TableCell isHeader className="border-y border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider py-3.5 px-4 text-right">
                Actions
              </TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => {
              const activeCount = activeLoadsCountByCustomer[customer.id] || 0;

              return (
                <TableRow key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Customer / Shipper Name */}
                  <TableCell className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold text-xs">
                        {customer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-slate-900 font-semibold text-sm">
                          {customer.name}
                        </p>
                        <p className="text-xs font-mono text-slate-500">
                          ID: {customer.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Billing Contact */}
                  <TableCell className="py-3.5 px-4">
                    <div className="flex flex-col gap-1 text-sm text-slate-800">
                      {customer.email ? (
                        <a
                          href={`mailto:${customer.email}`}
                          className="inline-flex items-center gap-1.5 text-slate-800 hover:text-blue-600 text-sm transition-colors font-medium"
                        >
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{customer.email}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-xs">No email</span>
                      )}
                      {customer.phone ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-800 text-sm font-mono font-medium">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{customer.phone}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">No phone</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Billing Address */}
                  <TableCell className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-800 text-sm max-w-xs truncate font-medium">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{customer.billingAddress || "—"}</span>
                    </div>
                  </TableCell>

                  {/* Active Loads Badge */}
                  <TableCell className="py-3.5 px-4">
                    {activeCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs px-2.5 py-1 rounded-full">
                        <Package className="h-3 w-3 text-emerald-600" />
                        {activeCount} Active {activeCount === 1 ? "Load" : "Loads"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center bg-slate-100 text-slate-600 border border-slate-200 font-medium text-xs px-2.5 py-1 rounded-full">
                        0 Active Loads
                      </span>
                    )}
                  </TableCell>

                  {/* Created On */}
                  <TableCell className="py-3.5 px-4 text-slate-700 text-sm font-medium">
                    {formatDate(customer.createdAt)}
                  </TableCell>

                  {/* Actions Link */}
                  <TableCell className="py-3.5 px-4 text-right">
                    <Link
                      href={`/loads?customerId=${customer.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-xs inline-flex items-center gap-1 transition-colors"
                    >
                      <span>View Loads</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Controlled Add Customer Modal for Empty State action */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={() => {
          setSuccessMessage("Customer created successfully");
          setTimeout(() => setSuccessMessage(null), 4000);
        }}
        trigger={null}
      />
    </div>
  );
}

export default CustomerTable;
