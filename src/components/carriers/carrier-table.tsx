"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ComplianceStatusBadge, deriveStoredComplianceBadge } from "@/components/carriers/compliance-badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/tailadmin/table";
import { Search, Truck, Mail, Phone, ShieldAlert, CheckCircle2, X, Pencil } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { CarrierOnboardDialog } from "@/components/carriers/carrier-onboard-dialog";
import { CarrierEditDialog } from "@/components/carriers/carrier-edit-dialog";
import { CarrierComplianceDialog } from "@/components/carriers/carrier-compliance-dialog";
import { VerifyCarrierSafetyButton } from "@/components/carriers/verify-carrier-safety-button";
import type { CarrierRecord } from "@/lib/repositories/carriers";

export interface CarrierTableProps {
  carriers: CarrierRecord[];
  coiSignedUrlByPath?: Record<string, string>;
  onOnboardCarrier?: () => void;
  initialInsuranceExpiredOnly?: boolean;
  initialComplianceFilter?: string;
  isOwner?: boolean;
}

export function CarrierTable({
  carriers,
  coiSignedUrlByPath = {},
  onOnboardCarrier,
  initialInsuranceExpiredOnly,
  initialComplianceFilter,
  isOwner = false,
}: CarrierTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [complianceFilter, setComplianceFilter] = useState(initialComplianceFilter ?? "ALL");
  const [insuranceExpiredOnly, setInsuranceExpiredOnly] = useState<boolean>(
    initialInsuranceExpiredOnly ?? false
  );
  const [isOnboardDialogOpen, setIsOnboardDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingCarrier, setEditingCarrier] = useState<CarrierRecord | null>(null);

  const handleOnboardCarrier = onOnboardCarrier || (() => setIsOnboardDialogOpen(true));

  const filteredCarriers = useMemo(() => {
    // Insurance-expired is a strict "already lapsed" date check
    // (insurance_expiry_date < today, matching v_exceptions'
    // expired_insurance_count, 055_v_exceptions_expired_insurance.sql) --
    // deliberately independent of deriveStoredComplianceBadge's "expiring"
    // badge, which also covers insurance expiring up to 30 days in the
    // future. Kept as its own toggle (same shape as loads' noCarrier/
    // pendingPod filters) rather than folded into the compliance dropdown,
    // so this predicate stays untouched by that badge's own definition.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return carriers.filter((carrier) => {
      const badge = deriveStoredComplianceBadge(carrier);
      if (complianceFilter !== "ALL" && badge !== complianceFilter) {
        return false;
      }

      if (insuranceExpiredOnly) {
        if (!carrier.insuranceExpiryDate) {
          return false;
        }
        if (new Date(carrier.insuranceExpiryDate) >= today) {
          return false;
        }
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
  }, [carriers, complianceFilter, insuranceExpiredOnly, searchTerm]);

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

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search by carrier name, MC, DOT, email..."
              aria-label="Search carriers by name, MC, or DOT"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full pl-9 pr-3.5 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            />
          </div>

          <div className="w-44">
            <select
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
              className="h-10 w-full px-3 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            >
              <option value="ALL">All Compliance</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
              <option value="expiring">Expiring</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          {insuranceExpiredOnly && (
            <button
              type="button"
              onClick={() => setInsuranceExpiredOnly(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 shadow-xs hover:bg-amber-100 transition-colors"
            >
              Insurance expired
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredCarriers.length} of {carriers.length} carriers
        </div>
      </div>

      {filteredCarriers.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No carriers found"
          description={
            searchTerm || complianceFilter !== "ALL" || insuranceExpiredOnly
              ? "No carrier matches your search criteria or compliance filter. Try adjusting your search."
              : "Onboard your first carrier partner to assign loads and issue rate confirmations."
          }
          action={{
            label: "Onboard Carrier",
            onClick: handleOnboardCarrier,
          }}
        />
      ) : (
        <Table>
          <TableHeader>
            <tr className="border-y border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider py-3.5 px-4">
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Carrier / Company</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">MC & DOT Numbers</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Dispatch Contact</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Compliance Status</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600 text-right">Actions</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredCarriers.map((carrier) => {
              const badge = deriveStoredComplianceBadge(carrier);

              return (
                <TableRow key={carrier.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Company Name */}
                  <TableCell className="py-3.5 px-4">
                    <Link
                      href={`/carriers/${carrier.id}`}
                      className="group/carrier-link flex items-center gap-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold text-xs">
                        {carrier.companyName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm group-hover/carrier-link:text-blue-600 group-hover/carrier-link:underline transition-colors">
                          {carrier.companyName}
                        </p>
                        <p className="text-xs font-mono text-slate-500">
                          ID: {carrier.id.slice(0, 8)}
                        </p>
                      </div>
                    </Link>
                  </TableCell>

                  {/* MC / DOT */}
                  <TableCell className="py-3.5 px-4">
                    <div className="flex flex-col gap-1 text-sm text-slate-700">
                      <span>
                        MC: {carrier.mcNumber ? (
                          <span className="font-mono font-semibold text-slate-900">{carrier.mcNumber}</span>
                        ) : (
                          <span className="text-slate-400">{"—"}</span>
                        )}
                      </span>
                      <span>
                        DOT: {carrier.dotNumber ? (
                          <span className="font-mono font-semibold text-slate-900">{carrier.dotNumber}</span>
                        ) : (
                          <span className="text-slate-400">{"—"}</span>
                        )}
                      </span>
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell className="py-3.5 px-4">
                    <div className="flex flex-col gap-1 text-sm text-slate-800">
                      {carrier.contactEmail ? (
                        <a
                          href={`mailto:${carrier.contactEmail}`}
                          className="inline-flex items-center gap-1.5 text-slate-800 hover:text-blue-600 text-sm transition-colors font-medium"
                        >
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{carrier.contactEmail}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">{"—"}</span>
                      )}
                      {carrier.contactPhone ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-800 text-sm font-mono font-medium">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{carrier.contactPhone}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">{"—"}</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Compliance */}
                  <TableCell className="py-3.5 px-4">
                    <ComplianceStatusBadge badge={badge} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => setEditingCarrier(carrier)}
                          aria-label={`Edit ${carrier.companyName}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:underline"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      )}
                      <CarrierComplianceDialog
                        carrier={carrier}
                        coiSignedUrl={carrier.coiFileUrl ? coiSignedUrlByPath[carrier.coiFileUrl] ?? null : null}
                        trigger={
                          <button
                            type="button"
                            aria-label={`Edit compliance details for ${carrier.companyName}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:underline"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Compliance
                          </button>
                        }
                      />
                      <VerifyCarrierSafetyButton carrier={carrier} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Controlled Carrier Onboard Dialog for Empty State action */}
      <CarrierOnboardDialog
        open={isOnboardDialogOpen}
        onOpenChange={setIsOnboardDialogOpen}
        onSuccess={() => {
          setSuccessMessage("Carrier onboarded successfully");
          setTimeout(() => setSuccessMessage(null), 4000);
        }}
        trigger={null}
      />

      {editingCarrier && (
        <CarrierEditDialog
          carrier={editingCarrier}
          open={!!editingCarrier}
          onOpenChange={(open) => {
            if (!open) setEditingCarrier(null);
          }}
          onSuccess={() => {
            setEditingCarrier(null);
            setSuccessMessage("Carrier updated successfully");
            setTimeout(() => setSuccessMessage(null), 4000);
          }}
        />
      )}
    </div>
  );
}

export default CarrierTable;
