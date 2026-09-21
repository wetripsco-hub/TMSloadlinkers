import Link from "next/link";
import { AlertTriangle, Truck, FileWarning, ShieldOff, ShieldAlert } from "lucide-react";
import type { Exceptions } from "@/lib/repositories/dashboard";

const MISSING_CARRIER_STATUSES = "covered,dispatched,at_pickup,in_transit,at_delivery";

// Rendered only when at least one count is > 0 -- an empty "all clear"
// state was deliberately left out of this default (see the conversation
// that scoped this component); propose that separately if it's wanted.
export function ExceptionWorkbench({ exceptions }: { exceptions: Exceptions }) {
  const { missingCarrierCount, pendingPodCount, expiredInsuranceCount, expiringInsuranceCount } =
    exceptions;

  if (
    missingCarrierCount === 0 &&
    pendingPodCount === 0 &&
    expiredInsuranceCount === 0 &&
    expiringInsuranceCount === 0
  ) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-amber-900">Needs attention</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {missingCarrierCount > 0 && (
          <Link
            href={`/loads?status=${MISSING_CARRIER_STATUSES}&noCarrier=1`}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3.5 py-2 text-sm font-medium text-amber-900 shadow-xs transition-colors hover:bg-amber-100"
          >
            <Truck className="h-4 w-4 text-amber-600" />
            {missingCarrierCount} load{missingCarrierCount === 1 ? "" : "s"} missing a carrier
          </Link>
        )}
        {pendingPodCount > 0 && (
          <Link
            href="/loads?status=delivered&pendingPod=1"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3.5 py-2 text-sm font-medium text-amber-900 shadow-xs transition-colors hover:bg-amber-100"
          >
            <FileWarning className="h-4 w-4 text-amber-600" />
            {pendingPodCount} delivered load{pendingPodCount === 1 ? "" : "s"} pending POD
          </Link>
        )}
        {expiredInsuranceCount > 0 && (
          <Link
            href="/carriers?insuranceExpired=1"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3.5 py-2 text-sm font-medium text-amber-900 shadow-xs transition-colors hover:bg-amber-100"
          >
            <ShieldOff className="h-4 w-4 text-amber-600" />
            {expiredInsuranceCount} carrier{expiredInsuranceCount === 1 ? "" : "s"} with expired insurance
          </Link>
        )}
        {expiringInsuranceCount > 0 && (
          <Link
            href="/carriers?compliance=expiring"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3.5 py-2 text-sm font-medium text-amber-900 shadow-xs transition-colors hover:bg-amber-100"
          >
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            {expiringInsuranceCount} carrier{expiringInsuranceCount === 1 ? "" : "s"} with insurance expiring soon
          </Link>
        )}
      </div>
    </div>
  );
}
