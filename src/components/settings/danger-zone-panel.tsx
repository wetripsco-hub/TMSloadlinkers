"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { requestDataReset, verifyDataResetCode } from "@/app/actions/data-reset";

export interface DataResetRequestState {
  id: string;
  status: string;
}

export function DangerZonePanel({
  initialRequest,
}: {
  initialRequest: DataResetRequestState | null;
}) {
  const [request, setRequest] = useState(initialRequest);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRequestReset = () => {
    setError(null);
    startTransition(async () => {
      try {
        const { requestId } = await requestDataReset();
        setRequest({ id: requestId, status: "pending_email" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to request data reset");
      }
    });
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;

    setError(null);
    startTransition(async () => {
      try {
        const ok = await verifyDataResetCode(request.id, code);
        if (ok) {
          setRequest({ ...request, status: "pending_approval" });
          setCode("");
        } else {
          setError("Incorrect or expired code. Try requesting a new reset.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to verify code");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-800">
        <AlertTriangle className="h-4 w-4" />
        Danger zone
      </div>
      <p className="mb-4 text-sm text-red-700">
        Permanently erase all loads, carriers, customers, documents, and invoices for this
        organization. This cannot be undone. Your account and team members are not affected.
      </p>

      {!request && (
        <button
          type="button"
          onClick={handleRequestReset}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Request data reset
        </button>
      )}

      {request?.status === "pending_email" && (
        <form onSubmit={handleVerifyCode} className="space-y-3">
          <p className="text-sm text-red-700">
            We emailed a 6-digit code to your organization&apos;s contact email. Enter it below to
            confirm.
          </p>
          <div className="flex items-center gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-32 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-slate-900 tracking-widest focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <button
              type="submit"
              disabled={isPending || code.length !== 6}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm code
            </button>
          </div>
        </form>
      )}

      {request?.status === "pending_approval" && (
        <p className="text-sm font-medium text-red-800">
          Awaiting Loadlinkers approval. You will be notified once the reset is complete.
        </p>
      )}

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}
