"use client";

import { useState, useTransition } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/tailadmin/table";
import { approveResetRequest, rejectResetRequest } from "@/app/actions/data-reset";

export interface ResetRequestRow {
  id: string;
  orgName: string;
  requesterEmail: string | null;
  requestedAt: string;
}

export function ResetRequestsQueue({ requests }: { requests: ResetRequestRow[] }) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApprove = (id: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await approveResetRequest(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to approve request");
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
    <div className="space-y-3">
      {error && <p className="text-xs text-red-600">{error}</p>}

      <Table>
        <TableHeader>
          <tr>
            <TableCell isHeader>Organization</TableCell>
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
              <TableCell colSpan={4} className="text-center text-slate-400">
                No reset requests awaiting approval.
              </TableCell>
            </TableRow>
          ) : (
            requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-medium text-slate-900">{req.orgName}</TableCell>
                <TableCell>{req.requesterEmail ?? "Unknown"}</TableCell>
                <TableCell>
                  {new Date(req.requestedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
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
                        placeholder="Reason"
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleReject(req.id)}
                        className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
                      >
                        Confirm reject
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(null)}
                        className="text-xs text-slate-400 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleApprove(req.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline disabled:opacity-60"
                      >
                        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(req.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:underline"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
