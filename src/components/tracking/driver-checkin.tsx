"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { DriverPingButton } from "@/components/tracking/driver-ping-button";
import { TrackingTimeline, type TrackingTimelineStop } from "@/components/tracking/tracking-timeline";
import { submitAdvanceStatusAction } from "@/app/track/[token]/actions";
import { getNextStatus } from "@/lib/domain/load-status";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DriverAdvanceableStatus, TrackedLoad } from "@/lib/repositories/tracking";

const DRIVER_ACTION_LABELS: Record<DriverAdvanceableStatus, string> = {
  at_pickup: "Arrived at Pickup",
  in_transit: "Loaded",
  at_delivery: "Arrived at Delivery",
  delivered: "Delivered",
};

const DRIVER_ADVANCEABLE_STATUSES: readonly DriverAdvanceableStatus[] = [
  "at_pickup",
  "in_transit",
  "at_delivery",
  "delivered",
];

function isDriverAdvanceable(status: string): status is DriverAdvanceableStatus {
  return (DRIVER_ADVANCEABLE_STATUSES as readonly string[]).includes(status);
}

export function DriverCheckin({ token, load }: { token: string; load: TrackedLoad }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const next = getNextStatus(load.status);
  const primaryTarget = next && isDriverAdvanceable(next) ? next : null;
  const nextNext = primaryTarget ? getNextStatus(primaryTarget) : null;
  const secondaryTarget = nextNext && isDriverAdvanceable(nextNext) ? nextNext : null;

  function handleAdvance(target: DriverAdvanceableStatus) {
    startTransition(async () => {
      await submitAdvanceStatusAction(token, target);
      router.refresh();
    });
  }

  const stops: TrackingTimelineStop[] = [
    {
      label: "Pickup",
      facilityName: load.originStop.facilityName,
      city: load.originStop.city,
      state: load.originStop.state,
      windowEnd: load.originStop.windowEnd,
      arrivedAt: load.arrivedAtPickupAt,
      isCompleted: Boolean(load.arrivedAtPickupAt),
      lat: load.lastKnownLat,
      lng: load.lastKnownLng,
    },
    {
      label: "Delivery",
      facilityName: load.destinationStop.facilityName,
      city: load.destinationStop.city,
      state: load.destinationStop.state,
      windowEnd: load.destinationStop.windowEnd,
      arrivedAt: load.arrivedAtDeliveryAt,
      isCompleted: Boolean(load.arrivedAtDeliveryAt),
      lat: load.lastKnownLat,
      lng: load.lastKnownLng,
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <span className="text-base font-bold text-slate-900">
            {load.loadNumber ? `#${load.loadNumber}` : "Shipment Tracking"}
          </span>
          <LoadStatusBadge status={load.status} />
        </div>
      </header>

      <div className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-28">
        <Tabs defaultValue="map">
          <TabsList className="w-full">
            <TabsTrigger value="map" className="gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Map
            </TabsTrigger>
          </TabsList>
          <TabsContent value="map" className="pt-3">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-500">Last known position</span>
                <span className="text-right font-mono text-xs text-slate-800 tabular-nums">
                  {load.lastKnownLat !== null && load.lastKnownLng !== null
                    ? `${load.lastKnownLat.toFixed(5)}, ${load.lastKnownLng.toFixed(5)}`
                    : "Waiting for driver ping..."}
                </span>
              </div>
              {load.lastPingAt && (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500">Last update</span>
                  <span className="text-right text-slate-700">
                    {formatDateTime(load.lastPingAt)}
                  </span>
                </div>
              )}
              <DriverPingButton token={token} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4">
          <TrackingTimeline stops={stops} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_12px_-4px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex max-w-md flex-col gap-2">
          {primaryTarget ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleAdvance(primaryTarget)}
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Updating..." : DRIVER_ACTION_LABELS[primaryTarget]}
            </button>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
              No driver action available for this shipment right now.
            </div>
          )}
          {secondaryTarget && (
            <button
              type="button"
              disabled
              className={cn(
                "inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-400",
                "cursor-not-allowed"
              )}
            >
              {DRIVER_ACTION_LABELS[secondaryTarget]}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
