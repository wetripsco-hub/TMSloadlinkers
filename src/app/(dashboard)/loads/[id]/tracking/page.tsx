import { notFound } from "next/navigation";

import { RealtimeTrackingPanel } from "@/components/tracking/realtime-tracking-panel";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { getLoadById } from "@/lib/repositories/loads";
import { listGpsPings } from "@/lib/repositories/tracking";

export default async function LoadTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const load = await getLoadById(id);

  if (!load) {
    notFound();
  }

  const pings = await listGpsPings(load.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-lg font-medium">
          Tracking · {load.loadNumber || load.id.slice(0, 8)}
        </h1>
        <LoadStatusBadge status={load.status} />
      </div>

      <RealtimeTrackingPanel
        loadId={load.id}
        trackingToken={load.trackingToken}
        driverName={load.driverName}
        driverPhone={load.driverPhone}
        truckNumber={load.truckNumber}
        trailerNumber={load.trailerNumber}
        lastKnownLat={load.lastKnownLat}
        lastKnownLng={load.lastKnownLng}
        lastPingAt={load.lastPingAt}
        initialPings={pings}
      />
    </div>
  );
}
