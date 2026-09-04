"use client";

import React, { useState, useMemo } from "react";
import { ComplianceStatusBadge, deriveStoredComplianceBadge } from "@/components/carriers/compliance-badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/tailadmin/table";
import { TailAdminInput, TailAdminSelect } from "@/components/ui/tailadmin/form-elements";
import { Search, Truck, Mail, Phone, ShieldCheck } from "lucide-react";
import type { CarrierRecord } from "@/lib/repositories/carriers";

export function CarrierTable({ carriers }: { carriers: CarrierRecord[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [complianceFilter, setComplianceFilter] = useState("ALL");

  const filteredCarriers = useMemo(() => {
    return carriers.filter((carrier) => {
      const badge = deriveStoredComplianceBadge(carrier);
      if (complianceFilter !== "ALL" && badge !== complianceFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = carrier.companyName.toLowerCase().includes(q);
        const matchesMc = (carrier.mcNumber || "").toLowerCase().includes(q);
        const matchesDot = (carrier.dotNumber || "").toLowerCase().includes(q);
        const matchesEmail = (carrier.contactEmail || "").toLowerCase().includes(q);
        const matchesPhone = (carrier.contactPhone || "").toLowerCase().includes(q);

        if (!matchesName && !matchesMc && !matchesDot && !matchesEmail && !matchesPhone) {
          return false;
        }
      }

      return true;
    });
  }, [carriers, complianceFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="w-full sm:max-w-xs">
            <TailAdminInput
              placeholder="Search by carrier name, MC, DOT, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startIcon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="w-44">
            <TailAdminSelect
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
              options={[
                { value: "ALL", label: "All Compliance" },
                { value: "verified", label: "Verified" },
                { value: "unverified", label: "Unverified" },
                { value: "expiring", label: "Expiring" },
                { value: "blocked", label: "Blocked" },
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          <span>Showing</span>
          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-bold text-gray-800 dark:bg-white/10 dark:text-white">
            {filteredCarriers.length}
          </span>
          <span>of {carriers.length} carriers</span>
        </div>
      </div>

      {filteredCarriers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-800 dark:bg-[#18171d]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-gray-800">
            <Truck className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
            No carriers found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || complianceFilter !== "ALL"
              ? "Try adjusting your search criteria or compliance filter."
              : "Onboard your first carrier partner to build your fleet network."}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableCell isHeader>Carrier / Company</TableCell>
              <TableCell isHeader>MC & DOT Numbers</TableCell>
              <TableCell isHeader>Dispatch Contact</TableCell>
              <TableCell isHeader>Compliance Status</TableCell>
              <TableCell isHeader className="text-right">Actions</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredCarriers.map((carrier) => {
              const badge = deriveStoredComplianceBadge(carrier);

              return (
                <TableRow key={carrier.id}>
                  {/* Company Name */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 font-bold text-xs">
                        {carrier.companyName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {carrier.companyName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {carrier.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* MC / DOT */}
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        MC: {carrier.mcNumber ? (
                          <span className="font-mono">{carrier.mcNumber}</span>
                        ) : (
                          <span className="text-gray-400 italic">None</span>
                        )}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        DOT: {carrier.dotNumber ? (
                          <span className="font-mono">{carrier.dotNumber}</span>
                        ) : (
                          <span className="text-gray-400 italic">None</span>
                        )}
                      </span>
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      {carrier.contactEmail ? (
                        <a
                          href={`mailto:${carrier.contactEmail}`}
                          className="flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-400"
                        >
                          <Mail className="h-3 w-3" />
                          {carrier.contactEmail}
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">No email</span>
                      )}
                      {carrier.contactPhone ? (
                        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300 font-mono">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {carrier.contactPhone}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">No phone</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Compliance */}
                  <TableCell>
                    <ComplianceStatusBadge badge={badge} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 cursor-pointer hover:underline">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verify Safety
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

export default CarrierTable;
