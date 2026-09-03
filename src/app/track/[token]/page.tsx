import { notFound } from "next/navigation";

import { getLoadByTrackingToken } from "@/lib/repositories/tracking";
import { DriverPingButton } from "@/components/tracking/driver-ping-button";
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
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="font-heading text-lg font-medium">Shipment tracking</h1>
        <p className="text-sm text-muted-foreground">
          {STATUS_LABELS[load.status]}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border p-4 text-sm">
        <div className="flex items-start justify-between gap-4">
          <span className="text-muted-foreground">Origin</span>
          <span className="text-right font-medium">{load.origin || "—"}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <span className="text-muted-foreground">Destination</span>
          <span className="text-right font-medium">{load.destination || "—"}</span>
        </div>
        {load.driverName && (
          <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">Driver</span>
            <span className="text-right font-medium">{load.driverName}</span>
          </div>
        )}
        {load.truckNumber && (
          <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">Truck</span>
            <span className="text-right font-medium">{load.truckNumber}</span>
          </div>
        )}
        {load.lastKnownLat !== null && load.lastKnownLng !== null && (
          <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">Last known position</span>
            <span className="text-right font-medium tabular-nums">
              {load.lastKnownLat.toFixed(4)}, {load.lastKnownLng.toFixed(4)}
            </span>
          </div>
        )}
        {load.lastPingAt && (
          <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">Last update</span>
            <span className="text-right font-medium">
              {new Date(load.lastPingAt).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <DriverPingButton token={token} />
    </div>
  );
}
