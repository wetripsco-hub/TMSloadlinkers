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
import { TailAdminInput } from "@/components/ui/tailadmin/form-elements";
import { Badge } from "@/components/ui/tailadmin/badge";
import { Search, Building2, Mail, Phone, MapPin, Package, ArrowRight } from "lucide-react";
import type { CustomerRecord } from "@/lib/repositories/customers";

export interface CustomerTableProps {
  customers: CustomerRecord[];
  activeLoadsCountByCustomer: Record<string, number>;
}

export function CustomerTable({
  customers,
  activeLoadsCountByCustomer,
}: CustomerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

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
      {/* Search Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <TailAdminInput
            placeholder="Search shippers by name, email, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<Search className="h-4 w-4" />}
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          <span>Showing</span>
          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-bold text-gray-800 dark:bg-white/10 dark:text-white">
            {filteredCustomers.length}
          </span>
          <span>of {customers.length} shippers</span>
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-800 dark:bg-[#18171d]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-gray-800">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
            No customers found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm
              ? "No customer matches your search term."
              : "Register your first shipper to begin issuing loads and quotes."}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableCell isHeader>Shipper / Customer</TableCell>
              <TableCell isHeader>Billing Contact</TableCell>
              <TableCell isHeader>Billing Address</TableCell>
              <TableCell isHeader>Active Loads</TableCell>
              <TableCell isHeader>Created On</TableCell>
              <TableCell isHeader className="text-right">Actions</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => {
              const activeCount = activeLoadsCountByCustomer[customer.id] || 0;

              return (
                <TableRow key={customer.id}>
                  {/* Name */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 font-bold text-xs">
                        {customer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {customer.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {customer.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      {customer.email ? (
                        <a
                          href={`mailto:${customer.email}`}
                          className="flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-400"
                        >
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">No email</span>
                      )}
                      {customer.phone ? (
                        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300 font-mono">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {customer.phone}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">No phone</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Billing Address */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span>{customer.billingAddress || "—"}</span>
                    </div>
                  </TableCell>

                  {/* Active Loads Count */}
                  <TableCell>
                    {activeCount > 0 ? (
                      <Badge color="success" size="sm" startIcon={<Package className="h-3 w-3" />}>
                        {activeCount} Active {activeCount === 1 ? "Load" : "Loads"}
                      </Badge>
                    ) : (
                      <Badge color="light" size="sm">
                        0 Active Loads
                      </Badge>
                    )}
                  </TableCell>

                  {/* Created On */}
                  <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(customer.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <Link
                      href={`/loads?customerId=${customer.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                    >
                      View Loads
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
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

export default CustomerTable;
