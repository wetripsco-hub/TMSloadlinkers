"use client";

import React, { useState, useTransition } from "react";
import { AlertTriangle, X, Loader2, ShieldAlert } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/tailadmin/table";
import { approveResetRequest, rejectResetRequest } from "@/app/actions/data-reset";

export interface ResetRequestRow {
  id: string;
  orgId: string;
  orgName: string;
  requesterEmail: string | null;
  requestedAt: string;
}

export function ResetRequestsQueue({ requests }: { requests: ResetRequestRow[] }) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [activeConfirmModal, setActiveConfirmModal] = useState<ResetRequestRow | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenApproveDialog = (req: ResetRequestRow) => {
    setError(null);
    setConfirmInput("");
    setActiveConfirmModal(req);
  };

  const handleCloseApproveDialog = () => {
    setActiveConfirmModal(null);
    setConfirmInput("");
  };

  const handleConfirmWipe = () => {
    if (!activeConfirmModal) return;
    if (confirmInput.trim() !== activeConfirmModal.orgName.trim()) return;

    const requestId = activeConfirmModal.id;
    setError(null);
    startTransition(async () => {
      try {
        await approveResetRequest(requestId);
        handleCloseApproveDialog();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to approve and execute data wipe");
      }
    });
  };

  const handleReject = (id: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await rejectResetRequest(id, reason);
        setRejectingId(null);
        setReason("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reject request");
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            ✕
          </button>
        </div>
      )}

      <Table>
        <TableHeader>
          <tr>
            <TableCell isHeader>Organization & Tenant ID</TableCell>
            <TableCell isHeader>Requested by</TableCell>
            <TableCell isHeader>Requested at</TableCell>
            <TableCell isHeader className="text-right">
              Actions
            </TableCell>
          </tr>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-slate-400">
                No reset requests awaiting approval.
              </TableCell>
            </TableRow>
          ) : (
            requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-slate-900">{req.orgName}</span>
                    <span
                      title="Tenant Org UUID (click to select and copy)"
                      className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 select-all w-fit border border-slate-200/60"
                    >
                      {req.orgId}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{req.requesterEmail ?? "Unknown"}</TableCell>
                <TableCell>
                  {new Date(req.requestedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell className="text-right">
                  {rejectingId === req.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Rejection reason"
                        className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleReject(req.id)}
                        className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60 transition-colors"
                      >
                        Confirm Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingId(null);
                          setReason("");
                        }}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setRejectingId(req.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                      {/* Danger Wipe Action Isolated with Distinct Warning Badge */}
                      <button
                        type="button"
                        onClick={() => handleOpenApproveDialog(req)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 hover:border-rose-400 transition-colors shadow-2xs"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                        Approve Wipe
                      </button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Inescapable Danger Confirmation Dialog */}
      {activeConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Catastrophic Tenant Data Reset
                </h3>
                <p className="text-xs text-rose-600 font-semibold">
                  MANDATORY PLATFORM SAFETY GATE
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-rose-200/80 bg-rose-50/70 p-3.5 text-xs text-rose-900 space-y-2">
              <p className="font-semibold leading-relaxed">
                This action will permanently wipe operational data for{" "}
                <span className="underline font-bold text-rose-950">{activeConfirmModal.orgName}</span>{" "}
                (<span className="font-mono text-rose-800">{activeConfirmModal.orgId}</span>).
                This action CANNOT be undone.
              </p>
              <p className="text-slate-600 text-[11px]">
                The following operational data will be permanently deleted: all freight loads, bills of lading, rate confirmations, customer accounts, carrier directories, invoices, payment vouchers, and internal audit logs.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirm-org-input"
                className="block text-xs font-semibold text-slate-700"
              >
                To confirm, type the exact organization name{" "}
                <span className="font-mono font-bold text-slate-900 select-all">
                  &ldquo;{activeConfirmModal.orgName}&rdquo;
                </span>{" "}
                below:
              </label>
              <input
                id="confirm-org-input"
                type="text"
                autoFocus
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={`Type "${activeConfirmModal.orgName}"`}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseApproveDialog}
                disabled={isPending}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  isPending ||
                  confirmInput.trim() !== activeConfirmModal.orgName.trim()
                }
                onClick={handleConfirmWipe}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Permanent Wipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResetRequestsQueue;
