"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/tailadmin/modal";
import {
  TailAdminInput,
  TailAdminLabel,
  TailAdminButton,
} from "@/components/ui/tailadmin/form-elements";
import { cancelLoadAction } from "@/app/(dashboard)/loads/[id]/actions";
import { XCircle, AlertTriangle } from "lucide-react";
import type { UUID } from "../../../types/domain";

export interface CancelLoadButtonProps {
  loadId: UUID;
}

export function CancelLoadButton({ loadId }: CancelLoadButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    setError(null);
    startTransition(async () => {
      try {
        await cancelLoadAction(loadId, reason);
        router.refresh();
        setIsOpen(false);
        setReason("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to cancel load");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setReason("");
          setError(null);
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50 transition-colors"
      >
        <XCircle className="h-3.5 w-3.5" />
        Cancel Load
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Cancel this load?"
        description="This action cannot be undone. The load status will be permanently set to cancelled and recorded in the audit trail."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 font-medium">
              Any linked invoices, documents, and audit history will be retained. Only the
              load status changes.
            </p>
          </div>

          <div>
            <TailAdminLabel htmlFor="cancel-reason">
              Reason for cancellation <span className="text-rose-500">*</span>
            </TailAdminLabel>
            <TailAdminInput
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Shipper cancelled, duplicate load, customer request…"
              maxLength={500}
            />
            <p className="mt-1 text-[11px] text-slate-400">{reason.length}/500 characters</p>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
            <TailAdminButton
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Keep Load
            </TailAdminButton>
            <TailAdminButton
              variant="danger"
              size="sm"
              type="button"
              onClick={handleCancel}
              loading={isPending}
              disabled={!reason.trim() || isPending}
            >
              Confirm Cancellation
            </TailAdminButton>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default CancelLoadButton;
