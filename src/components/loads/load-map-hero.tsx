"use client";

import React, { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Bookmark,
  ArrowRight,
  ClipboardList,
  FileCheck,
  Truck,
  MapPin,
  CheckCircle2,
  Calendar,
  Box,
  Layers,
  ChevronRight,
  ShieldAlert,
  Clock,
  Compass,
  Navigation,
} from "lucide-react";
import type { Load, LoadStatus } from "../../../types/domain";
import type { CustomerRecord } from "@/lib/repositories/customers";
import { formatDateTime, formatDate } from "@/lib/format";
import {
  parseCityStateFromAddress,
  resolveCoordinates,
  calculateHaversineDistanceMiles,
  type RouteCalculationResult,
} from "./route-utils";

// Dynamic import with SSR disabled to prevent Leaflet window errors
const RouteLeafletMap = dynamic(() => import("./route-leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full min-h-[300px] flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-2">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      <span className="text-xs font-medium">Loading interactive route map...</span>
    </div>
  ),
});

interface LifecycleStage {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
  { key: "quoted", label: "Quoted", icon: ClipboardList },
  { key: "dispatched", label: "Dispatched", icon: FileCheck },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "delivered", label: "Delivered", icon: MapPin },
  { key: "complete", label: "Complete", icon: CheckCircle2 },
];

function getStageIndex(status: LoadStatus): number {
  switch (status) {
    case "quoted":
    case "posted_to_boards":
    case "covered":
      return 0;
    case "dispatched":
      return 1;
    case "at_pickup":
    case "in_transit":
    case "at_delivery":
      return 2;
    case "delivered":
    case "pod_uploaded":
      return 3;
    case "invoiced":
    case "settled":
      return 4;
    default:
      return 0;
  }
}

export interface LoadMapHeroProps {
  load: Load;
  customer?: CustomerRecord | null;
}

export function LoadMapHero({ load, customer }: LoadMapHeroProps) {
  const [isBookmarked, setIsBookmarked] = useState(true);

  // Extract / Resolve city and state cleanly
  const originParsed = parseCityStateFromAddress(
    load.origin?.city,
    load.origin?.state,
    load.origin?.address
  );
  const destParsed = parseCityStateFromAddress(
    load.destination?.city,
    load.destination?.state,
    load.destination?.address
  );

  const originCityState =
    originParsed.city && originParsed.state
      ? `${originParsed.city}, ${originParsed.state}`
      : originParsed.city || load.origin?.facilityName || "Origin";

  const destCityState =
    destParsed.city && destParsed.state
      ? `${destParsed.city}, ${destParsed.state}`
      : destParsed.city || load.destination?.facilityName || "Destination";

  const originCoords = resolveCoordinates(
    load.origin?.city,
    load.origin?.state,
    load.origin?.address
  );
  const destCoords = resolveCoordinates(
    load.destination?.city,
    load.destination?.state,
    load.destination?.address
  );
  const initialMiles = calculateHaversineDistanceMiles(originCoords, destCoords);

  const [routeInfo, setRouteInfo] = useState<RouteCalculationResult>({
    distanceMiles: initialMiles,
    source: "haversine",
  });

  const handleRouteCalculated = useCallback((result: RouteCalculationResult) => {
    setRouteInfo((prev) => {
      if (
        prev.distanceMiles === result.distanceMiles &&
        prev.durationText === result.durationText &&
        prev.source === result.source
      ) {
        return prev;
      }
      return result;
    });
  }, []);

  const originLat = (load.origin as { lat?: number | null })?.lat;
  const originLng = (load.origin as { lng?: number | null })?.lng;
  const originMapProp = useMemo(
    () => ({
      city: originParsed.city,
      state: originParsed.state,
      address: load.origin?.address,
      facilityName: load.origin?.facilityName,
      lat: originLat,
      lng: originLng,
    }),
    [originParsed.city, originParsed.state, load.origin?.address, load.origin?.facilityName, originLat, originLng]
  );

  const destLat = (load.destination as { lat?: number | null })?.lat;
  const destLng = (load.destination as { lng?: number | null })?.lng;
  const destMapProp = useMemo(
    () => ({
      city: destParsed.city,
      state: destParsed.state,
      address: load.destination?.address,
      facilityName: load.destination?.facilityName,
      lat: destLat,
      lng: destLng,
    }),
    [destParsed.city, destParsed.state, load.destination?.address, load.destination?.facilityName, destLat, destLng]
  );

  const currentStageIndex = getStageIndex(load.status);
  const isCancelled = load.status === "cancelled";

  // Customer display
  const customerName = customer?.name || load.origin?.facilityName || "Direct Shipper";
  const customerInitial = customerName.charAt(0).toUpperCase();

  // Driver telemetry if available
  const driverLocation =
    load.lastKnownLat && load.lastKnownLng
      ? { lat: load.lastKnownLat, lng: load.lastKnownLng }
      : null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column (Details & Lifecycle) */}
        <div className="lg:col-span-6 xl:col-span-5 p-6 flex flex-col justify-between">
          <div>
            {/* Customer / Shipper Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className="text-slate-400 hover:text-amber-500 transition-colors"
                  title="Bookmark shipper"
                >
                  <Bookmark
                    className={`h-4 w-4 ${
                      isBookmarked ? "text-amber-500 fill-amber-500" : "text-slate-400"
                    }`}
                  />
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 border border-blue-100 text-blue-700 font-bold text-xs">
                    {customerInitial}
                  </div>
                  <span className="text-slate-900 font-bold text-sm tracking-tight">
                    {customerName}
                  </span>
                </div>
              </div>

              {/* Timestamp / Load Badge */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {load.createdAt
                    ? formatDateTime(load.createdAt)
                    : formatDate(new Date().toISOString())}
                </span>
              </div>
            </div>

            {/* Route Header */}
            <div className="mt-4">
              <div className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                <span>{originCityState}</span>
                <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                <span>{destCityState}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>2 Stops</span>
                <span>•</span>
                <span>Load #{load.loadNumber || load.id.slice(0, 8).toUpperCase()}</span>
                {load.customerPoNumber && (
                  <>
                    <span>•</span>
                    <span>PO #{load.customerPoNumber}</span>
                  </>
                )}
              </p>

              {/* Real Driving Route Distance & Time Badge */}
              <div className="mt-2.5 flex items-center gap-2 flex-wrap text-xs">
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 font-bold text-white shadow-sm ring-1 ring-blue-500/50">
                  <Navigation className="h-4 w-4 shrink-0 text-white" />
                  <span>
                    Total Distance: {routeInfo.distanceMiles.toLocaleString()} mi
                  </span>
                </div>
                {routeInfo.durationText && (
                  <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200/80 px-2.5 py-1.5 font-medium text-slate-700">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Est. Drive: ~{routeInfo.durationText}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chevron Lifecycle Ribbon */}
            <div className="my-5">
              {isCancelled ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Shipment Cancelled</span>
                </div>
              ) : (
                <div className="flex items-center rounded-lg border border-slate-200/90 bg-slate-50/70 p-1 gap-1 overflow-x-auto text-xs scrollbar-none">
                  {LIFECYCLE_STAGES.map((stage, idx) => {
                    const isActive = currentStageIndex === idx;
                    const isCompleted = currentStageIndex > idx;
                    const Icon = stage.icon;

                    return (
                      <React.Fragment key={stage.key}>
                        <div
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all shrink-0 select-none ${
                            isActive
                              ? "bg-blue-600 text-white font-semibold shadow-sm"
                              : isCompleted
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <Icon
                            className={`h-3.5 w-3.5 ${
                              isActive
                                ? "text-white"
                                : isCompleted
                                ? "text-blue-600"
                                : "text-slate-400"
                            }`}
                          />
                          <span>{stage.label}</span>
                          {isCompleted && (
                            <span className="text-[10px] text-blue-600 font-bold ml-0.5">
                              ✓
                            </span>
                          )}
                        </div>
                        {idx < LIFECYCLE_STAGES.length - 1 && (
                          <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Details Grid (2 columns) */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 bg-slate-50/40 rounded-lg p-3.5 mt-2">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Pickup Date (Origin)
              </span>
              <p className="text-xs font-semibold text-slate-900 mt-1">
                {load.origin?.windowStart
                  ? formatDateTime(load.origin.windowStart)
                  : "Scheduled Window"}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Delivery Date (Dest)
              </span>
              <p className="text-xs font-semibold text-slate-900 mt-1">
                {load.destination?.windowStart
                  ? formatDateTime(load.destination.windowStart)
                  : "Scheduled Window"}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                Equipment
              </span>
              <p className="text-xs font-semibold text-slate-900 mt-1">
                {load.equipmentType || "53' Dry Van"}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Box className="h-3.5 w-3.5 text-slate-400" />
                Commodity & Weight
              </span>
              <p className="text-xs font-semibold text-slate-900 mt-1 truncate">
                {load.commodity || "General Freight"}
                {load.weightLbs ? ` • ${load.weightLbs.toLocaleString()} lbs` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (Interactive Leaflet Route Map) */}
        <div className="lg:col-span-6 xl:col-span-7 relative min-h-[320px] lg:min-h-[380px] border-t lg:border-t-0 lg:border-l border-slate-200/80 bg-slate-50 overflow-hidden flex flex-col">
          {/* Map Header Floating Overlay Badges */}
          <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 pointer-events-none">
            <div className="flex items-center gap-1.5 rounded-md bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-sm border border-slate-200/80 pointer-events-auto">
              <Compass className="h-3.5 w-3.5 text-blue-600" />
              <span>Route Plan</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 rounded-md bg-white/95 backdrop-blur-sm px-2 py-1 text-[10px] font-medium text-slate-600 shadow-sm border border-slate-200/80 pointer-events-auto">
              <span>Esri World Light</span>
            </div>
            <div className="flex items-center gap-1 rounded-md bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold text-blue-700 shadow-sm border border-blue-200/80 pointer-events-auto">
              <Navigation className="h-3 w-3 text-blue-600" />
              <span>Total Distance: {routeInfo.distanceMiles.toLocaleString()} mi</span>
            </div>
          </div>

          {/* Leaflet Map */}
          <div className="h-full w-full flex-1 min-h-[320px]">
            <RouteLeafletMap
              origin={originMapProp}
              destination={destMapProp}
              driverLocation={driverLocation}
              onRouteCalculated={handleRouteCalculated}
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadMapHero;
