"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TailAdminButton, TailAdminSelect } from "@/components/ui/tailadmin/form-elements";
import { RateConfirmationModal } from "@/components/documents/rate-confirmation-modal";
import { assignCarrierToLoad } from "@/app/(dashboard)/loads/[id]/actions";
import { Truck, CheckCircle2, UserCheck, FileText, AlertCircle } from "lucide-react";
import type { Load, Organization } from "../../../types/domain";
import type { CarrierRecord } from "@/lib/repositories/carriers";

export interface CarrierAssignmentCardProps {
  load: Load;
  assignedCarrier: CarrierRecord | null;
  availableCarriers: CarrierRecord[];
  organization?: Organization | null;
}

export function CarrierAssignmentCard({
  load,
  assignedCarrier,
  availableCarriers,
  organization,
}: CarrierAssignmentCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>(
    assignedCarrier?.id || (availableCarriers[0]?.id ?? "")
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAssign = () => {
    if (!selectedCarrierId) return;
    setError(null);
    startTransition(async () => {
      try {
        await assignCarrierToLoad(load.id, selectedCarrierId);
        setIsEditing(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to assign carrier");
      }
    });
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-row items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Truck className="h-4 w-4 text-slate-400" />
          Assigned Transportation Carrier
        </h3>

        {!isEditing && (
          <div className="flex items-center gap-2">
            {assignedCarrier && (
              <RateConfirmationModal
                load={load}
                carrier={assignedCarrier}
                organization={organization}
                triggerButton={
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span>Rate Con</span>
                  </button>
                }
              />
            )}
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              {assignedCarrier ? "Reassign" : "Assign Carrier"}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5 text-sm">
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <p className="text-xs font-semibold text-slate-700">
              Select an onboarded motor carrier:
            </p>
            <TailAdminSelect
              value={selectedCarrierId}
              onChange={(e) => setSelectedCarrierId(e.target.value)}
              options={availableCarriers.map((c) => ({
                value: c.id,
                label: `${c.companyName} (MC# ${c.mcNumber || "N/A"})`,
              }))}
            />

            <div className="flex items-center gap-2 justify-end pt-1">
              <TailAdminButton
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isPending}
              >
                Cancel
              </TailAdminButton>
              <TailAdminButton
                variant="primary"
                size="sm"
                onClick={handleAssign}
                loading={isPending}
                startIcon={<UserCheck className="h-4 w-4" />}
              >
                Save Assignment
              </TailAdminButton>
            </div>
          </div>
        ) : assignedCarrier ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-base">
                {assignedCarrier.companyName}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                Active Carrier
              </span>
            </div>
            <p className="text-xs text-slate-500">
              MC #{assignedCarrier.mcNumber ?? "—"} · USDOT #{assignedCarrier.dotNumber ?? "—"}
            </p>
            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/60 border border-slate-100 rounded-lg p-2.5">
              <p>Email: <span className="font-medium text-slate-900">{assignedCarrier.contactEmail ?? "—"}</span></p>
              <p>Phone: <span className="font-medium text-slate-900">{assignedCarrier.contactPhone ?? "—"}</span></p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <Truck className="h-8 w-8 text-slate-400 mb-2" />
            <p className="text-xs font-semibold text-slate-700">
              No carrier assigned to this load yet.
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Assign an onboarded carrier to generate official rate confirmations.
            </p>
            <TailAdminButton
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setIsEditing(true)}
            >
              Assign Carrier
            </TailAdminButton>
          </div>
        )}
      </div>
    </div>
  );
}

export default CarrierAssignmentCard;
