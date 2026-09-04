"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TailAdminButton, TailAdminSelect } from "@/components/ui/tailadmin/form-elements";
import { RateConfirmationModal } from "@/components/documents/rate-confirmation-modal";
import { assignCarrierToLoad } from "@/app/(dashboard)/loads/[id]/actions";
import { Truck, CheckCircle2, UserCheck, FileText, AlertCircle } from "lucide-react";
import type { Load } from "../../../types/domain";
import type { CarrierRecord } from "@/lib/repositories/carriers";

export interface CarrierAssignmentCardProps {
  load: Load;
  assignedCarrier: CarrierRecord | null;
  availableCarriers: CarrierRecord[];
}

export function CarrierAssignmentCard({
  load,
  assignedCarrier,
  availableCarriers,
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
    <Card className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Truck className="h-4 w-4 text-brand-500" />
          Assigned Transportation Carrier
        </CardTitle>

        {!isEditing && (
          <div className="flex items-center gap-2">
            {assignedCarrier && (
              <RateConfirmationModal
                load={load}
                carrier={assignedCarrier}
                triggerButton={
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50/80 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:border-brand-900/60 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Generate Rate Con</span>
                  </button>
                }
              />
            )}
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              {assignedCarrier ? "Reassign" : "Assign Carrier"}
            </button>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-2.5 text-sm pt-0">
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
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
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 dark:text-white text-base">
                {assignedCarrier.companyName}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="h-3 w-3" />
                Active Carrier
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              MC #{assignedCarrier.mcNumber ?? "—"} · USDOT #{assignedCarrier.dotNumber ?? "—"}
            </p>
            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-gray-600 dark:text-gray-400">
              <p>Email: <span className="font-medium text-gray-900 dark:text-white">{assignedCarrier.contactEmail ?? "—"}</span></p>
              <p>Phone: <span className="font-medium text-gray-900 dark:text-white">{assignedCarrier.contactPhone ?? "—"}</span></p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
            <Truck className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              No carrier assigned to this load yet.
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
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
      </CardContent>
    </Card>
  );
}

export default CarrierAssignmentCard;
