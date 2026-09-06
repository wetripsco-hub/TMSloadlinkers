import React from "react";
import Link from "next/link";
import { listLoads } from "@/lib/repositories/loads";
import { PageHeader } from "@/components/layout/page-header";
import { RefreshLocationsButton } from "@/components/tracking/refresh-locations-button";
import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/format";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/tailadmin/table";
import {
  Navigation,
  Truck,
  MapPin,
  Clock,
  Radio,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Tracking | FreightLink TMS",
};

export default async function DriverTrackingPage() {
  const loadsResult = await listLoads({}, { page: 1, pageSize: 100 });
  const allLoads = loadsResult.data;

  // Filter loads that are actively in pipeline or have driver/tracking info
  const trackingLoads = allLoads.filter(
    (load) =>
      load.status !== "cancelled" &&
      load.status !== "settled" &&
      (load.driverName || load.trackingToken || load.status === "in_transit" || load.status === "dispatched")
  );

  const rollingGpsCount = trackingLoads.filter(
    (l) => l.lastKnownLat !== null && l.lastKnownLng !== null
  ).length;

  const assignedDriversCount = trackingLoads.filter((l) => !!l.driverName).length;
  const inTransitCount = trackingLoads.filter((l) => l.status === "in_transit" || l.status === "at_delivery").length;

  return (
    <div className="space-y-6">
      {/* Standardized Page Header with Action */}
      <PageHeader
        title="Driver & Telemetry Tracking"
        subtitle="Live GPS location pings, real-time driver breadcrumbs, and route progression."
        breadcrumbs={[
          { label: "Operations", href: "/overview" },
          { label: "Driver Tracking", href: "/driver-tracking" },
        ]}
        action={<RefreshLocationsButton />}
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Tracked Loads"
          value={trackingLoads.length}
          icon={<Navigation className="h-5 w-5 text-blue-600" />}
          badgeText="Active"
          badgeColor="primary"
          subtitle="Shipments with live telemetry"
          variant="plausible"
        />

        <MetricCard
          title="Live GPS Pinging"
          value={rollingGpsCount}
          icon={<Radio className="h-5 w-5 text-emerald-600" />}
          badgeText="Telemetry OK"
          badgeColor="success"
          subtitle="Active coordinate broadcasts"
          variant="plausible"
        />

        <MetricCard
          title="Drivers Assigned"
          value={assignedDriversCount}
          icon={<Truck className="h-5 w-5 text-sky-600" />}
          badgeText="Dispatched"
          badgeColor="info"
          subtitle="Drivers connected to mobile app"
          variant="plausible"
        />

        <MetricCard
          title="Rolling In-Transit"
          value={inTransitCount}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          badgeText="On Highway"
          badgeColor="warning"
          subtitle="Currently rolling toward delivery"
          variant="plausible"
        />
      </div>

      {/* Fleet Tracking Table */}
      {trackingLoads.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No active tracking sessions"
          description="Dispatch a load with driver mobile tracking enabled to monitor real-time telemetry."
          action={{
            label: "View Active Loads",
            href: "/loads",
          }}
        />
      ) : (
        <Table>
          <TableHeader>
            <tr className="border-y border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider py-3.5 px-4">
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Load #</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Driver & Vehicle</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Origin → Destination</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Last GPS Coordinates</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Last Telemetry Ping</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Status</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600 text-right">Actions</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {trackingLoads.map((load) => {
              const formattedLoadNum = load.loadNumber || `LD-${load.id.slice(0, 6).toUpperCase()}`;
              const hasGps = load.lastKnownLat !== null && load.lastKnownLng !== null;

              return (
                <TableRow key={load.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Load # */}
                  <TableCell className="py-3.5 px-4">
                    <Link
                      href={`/loads/${load.id}`}
                      className="font-semibold text-blue-600 hover:text-blue-700 text-sm transition-colors"
                    >
                      {formattedLoadNum}
                    </Link>
                  </TableCell>

                  {/* Driver & Vehicle */}
                  <TableCell className="py-3.5 px-4">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {load.driverName || "Driver Unassigned"}
                      </p>
                      <p className="text-xs font-mono text-slate-500">
                        {load.truckNumber ? `Truck: ${load.truckNumber}` : "No truck assigned"}
                        {load.trailerNumber ? ` · Trl: ${load.trailerNumber}` : ""}
                      </p>
                    </div>
                  </TableCell>

                  {/* Route */}
                  <TableCell className="py-3.5 px-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">
                        {load.origin?.address || "Pending Origin"}
                      </span>
                      <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-900">
                        {load.destination?.address || "Pending Dest"}
                      </span>
                    </div>
                  </TableCell>

                  {/* GPS Coordinates with Crisp Ping Animation */}
                  <TableCell className="py-3.5 px-4">
                    {hasGps ? (
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>
                          {load.lastKnownLat?.toFixed(4)}, {load.lastKnownLng?.toFixed(4)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No GPS signal</span>
                    )}
                  </TableCell>

                  {/* Last Ping */}
                  <TableCell className="py-3.5 px-4 text-xs text-slate-600">
                    {load.lastPingAt ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDateTime(load.lastPingAt)}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Awaiting ping</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3.5 px-4">
                    <LoadStatusBadge status={load.status} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/loads/${load.id}/tracking`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <span>Telemetry</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                      {load.trackingToken && (
                        <Link
                          href={`/track/${load.trackingToken}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Driver Portal"
                          className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
