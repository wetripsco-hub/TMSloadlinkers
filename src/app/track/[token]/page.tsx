import { MapPin } from "lucide-react";
import { getLoadByTrackingToken } from "@/lib/repositories/tracking";
import { DriverPingButton } from "@/components/tracking/driver-ping-button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/format";
import type { LoadStatus } from "../../../../types/domain";

const STATUS_LABELS: Record<LoadStatus, string> = {
  quoted: "Quoted",
  posted_to_boards: "Posted to boards",
  covered: "Covered",
  dispatched: "Dispatched",
  at_pickup: "At pickup",
  in_transit: "In transit",
  at_delivery: "At delivery",
  delivered: "Delivered",
  pod_uploaded: "POD uploaded",
  invoiced: "Invoiced",
  settled: "Settled",
  cancelled: "Cancelled",
};

export default async function TrackLoadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const load = await getLoadByTrackingToken(token);

  if (!load) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
        <EmptyState
          icon={MapPin}
          title="Shipment Not Found"
          description="This tracking link is invalid, has expired, or the shipment has been completed. Please contact your dispatch coordinator."
        />
      </div>
    );
  }

  const coordinatesDisplay =
    load.lastKnownLat !== null && load.lastKnownLng !== null
      ? `${load.lastKnownLat.toFixed(5)}, ${load.lastKnownLng.toFixed(5)}`
      : "Waiting for driver ping...";

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Shipment Tracking</h1>
        <p className="text-sm font-medium text-blue-600 mt-0.5">
          {STATUS_LABELS[load.status]}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm text-sm divide-y divide-slate-100">
        <div className="flex items-start justify-between gap-4 pt-1">
          <span className="text-slate-500">Origin</span>
          <span className="text-right font-medium text-slate-900">{load.origin || "—"}</span>
        </div>
        <div className="flex items-start justify-between gap-4 pt-2">
          <span className="text-slate-500">Destination</span>
          <span className="text-right font-medium text-slate-900">{load.destination || "—"}</span>
        </div>
        {load.driverName && (
          <div className="flex items-start justify-between gap-4 pt-2">
            <span className="text-slate-500">Driver</span>
            <span className="text-right font-medium text-slate-900">{load.driverName}</span>
          </div>
        )}
        {load.truckNumber && (
          <div className="flex items-start justify-between gap-4 pt-2">
            <span className="text-slate-500">Truck</span>
            <span className="text-right font-mono text-slate-800">{load.truckNumber}</span>
          </div>
        )}
        <div className="flex items-start justify-between gap-4 pt-2">
          <span className="text-slate-500">Last Known Position</span>
          <span className="text-right font-mono text-slate-800 tabular-nums">
            {coordinatesDisplay}
          </span>
        </div>
        {load.lastPingAt && (
          <div className="flex items-start justify-between gap-4 pt-2">
            <span className="text-slate-500">Last Update</span>
            <span className="text-right text-slate-700">
              {formatDateTime(load.lastPingAt)}
            </span>
          </div>
        )}
      </div>

      <DriverPingButton token={token} />
    </div>
  );
}
