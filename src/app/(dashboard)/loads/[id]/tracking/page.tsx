import { notFound } from "next/navigation";
import Link from "next/link";
import { RealtimeTrackingPanel } from "@/components/tracking/realtime-tracking-panel";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { getLoadById } from "@/lib/repositories/loads";
import { listGpsPings } from "@/lib/repositories/tracking";
import { ArrowLeft } from "lucide-react";

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
  const loadLabel = load.loadNumber || `LD-${load.id.slice(0, 6).toUpperCase()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Live Telemetry · ${loadLabel}`}
        subtitle="Real-time GPS breadcrumbs, driver check-ins, and geolocation tracking."
        breadcrumbs={[
          { label: "Operations", href: "/overview" },
          { label: "Loads", href: "/loads" },
          { label: loadLabel, href: `/loads/${load.id}` },
          { label: "Live Tracking" },
        ]}
        action={
          <div className="flex items-center gap-3">
            <LoadStatusBadge status={load.status} />
            <Link
              href={`/loads/${load.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Load
            </Link>
          </div>
        }
      />

      <div className="mx-auto max-w-3xl">
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
    </div>
  );
}
