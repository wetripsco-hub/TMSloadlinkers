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
import { Search, Truck, Mail, Phone, ShieldCheck, CheckCircle2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { CarrierOnboardDialog } from "@/components/carriers/carrier-onboard-dialog";
import { previewCarrierVerification } from "@/app/(dashboard)/carriers/actions";
import type { CarrierRecord } from "@/lib/repositories/carriers";

export interface CarrierTableProps {
  carriers: CarrierRecord[];
  onOnboardCarrier?: () => void;
}

export function CarrierTable({ carriers, onOnboardCarrier }: CarrierTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [complianceFilter, setComplianceFilter] = useState("ALL");
  const [isOnboardDialogOpen, setIsOnboardDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<{
    id: string;
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleOnboardCarrier = onOnboardCarrier || (() => setIsOnboardDialogOpen(true));

  async function handleVerifySafety(carrier: CarrierRecord) {
    if (!carrier.dotNumber && !carrier.mcNumber) {
      setVerificationFeedback({
        id: carrier.id,
        message: "No DOT/MC on file",
        type: "error",
      });
      setTimeout(() => setVerificationFeedback(null), 3000);
      return;
    }

    setVerifyingId(carrier.id);
    try {
      const res = await previewCarrierVerification({
        dotNumber: carrier.dotNumber || undefined,
        mcNumber: carrier.mcNumber || undefined,
      });
      setVerificationFeedback({
        id: carrier.id,
        message: `${res.safetyRating.toUpperCase()} · ${res.authorityActive ? "Active" : "Inactive"}`,
        type: "success",
      });
      setTimeout(() => setVerificationFeedback(null), 4000);
    } catch (err) {
      setVerificationFeedback({
        id: carrier.id,
        message: err instanceof Error ? err.message : "Verification failed",
        type: "error",
      });
      setTimeout(() => setVerificationFeedback(null), 3000);
    } finally {
      setVerifyingId(null);
    }
  }

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
            searchTerm || complianceFilter !== "ALL"
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
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold text-xs">
                        {carrier.companyName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {carrier.companyName}
                        </p>
                        <p className="text-xs font-mono text-slate-500">
                          ID: {carrier.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* MC / DOT */}
                  <TableCell className="py-3.5 px-4">
                    <div className="flex flex-col gap-1 text-sm text-slate-600">
                      <span>
                        MC: {carrier.mcNumber ? (
                          <span className="font-mono font-medium text-slate-800">{carrier.mcNumber}</span>
                        ) : (
                          <span className="text-slate-400">{"—"}</span>
                        )}
                      </span>
                      <span>
                        DOT: {carrier.dotNumber ? (
                          <span className="font-mono font-medium text-slate-800">{carrier.dotNumber}</span>
                        ) : (
                          <span className="text-slate-400">{"—"}</span>
                        )}
                      </span>
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell className="py-3.5 px-4">
                    <div className="flex flex-col gap-1 text-sm text-slate-600">
                      {carrier.contactEmail ? (
                        <a
                          href={`mailto:${carrier.contactEmail}`}
                          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 text-sm transition-colors"
                        >
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{carrier.contactEmail}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">{"—"}</span>
                      )}
                      {carrier.contactPhone ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-600 text-sm font-mono">
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
                    {verificationFeedback?.id === carrier.id ? (
                      <span
                        className={
                          verificationFeedback.type === "success"
                            ? "inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"
                            : "inline-flex items-center gap-1 text-xs font-semibold text-rose-600"
                        }
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {verificationFeedback.message}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleVerifySafety(carrier)}
                        disabled={verifyingId === carrier.id}
                        aria-label={`Verify safety compliance for ${carrier.companyName}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:underline"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {verifyingId === carrier.id ? "Verifying..." : "Verify Safety"}
                      </button>
                    )}
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
    </div>
  );
}

export default CarrierTable;
