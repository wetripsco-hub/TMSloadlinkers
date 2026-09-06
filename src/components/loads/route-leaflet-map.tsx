"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  parseCityStateFromAddress,
  resolveCoordinates,
  calculateHaversineDistanceMiles,
  formatDuration,
  type RouteCalculationResult,
} from "./route-utils";

export {
  parseCityStateFromAddress,
  resolveCoordinates,
  calculateHaversineDistanceMiles,
  formatDuration,
  type RouteCalculationResult,
};

export interface RouteLeafletMapProps {
  origin: {
    city?: string;
    state?: string;
    address?: string | null;
    facilityName?: string | null;
    lat?: number | null;
    lng?: number | null;
  };
  destination: {
    city?: string;
    state?: string;
    address?: string | null;
    facilityName?: string | null;
    lat?: number | null;
    lng?: number | null;
  };
  driverLocation?: {
    lat: number;
    lng: number;
  } | null;
  className?: string;
  onRouteCalculated?: (result: RouteCalculationResult) => void;
}

export function RouteLeafletMap({
  origin,
  destination,
  driverLocation,
  className = "",
  onRouteCalculated,
}: RouteLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const onRouteCalculatedRef = useRef(onRouteCalculated);
  useEffect(() => {
    onRouteCalculatedRef.current = onRouteCalculated;
  });

  const lastReportedRef = useRef<{ miles: number; source: string; duration?: string } | null>(null);

  // Extract primitive dependencies to prevent reference instability
  const originCity = origin.city || "";
  const originState = origin.state || "";
  const originAddress = origin.address || "";
  const originFacility = origin.facilityName || "";
  const originLat = origin.lat ?? null;
  const originLng = origin.lng ?? null;

  const destCity = destination.city || "";
  const destState = destination.state || "";
  const destAddress = destination.address || "";
  const destFacility = destination.facilityName || "";
  const destLat = destination.lat ?? null;
  const destLng = destination.lng ?? null;

  const driverLat = driverLocation?.lat ?? null;
  const driverLng = driverLocation?.lng ?? null;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Reset container's leaflet id if re-mounting
    if ((mapContainerRef.current as { _leaflet_id?: unknown })._leaflet_id) {
      delete (mapContainerRef.current as { _leaflet_id?: unknown })._leaflet_id;
    }

    // Resolve Origin and Destination Lat/Lng
    const originCoords = resolveCoordinates(originCity, originState, originAddress, {
      lat: originLat,
      lng: originLng,
    });
    const destCoords = resolveCoordinates(destCity, destState, destAddress, {
      lat: destLat,
      lng: destLng,
    });

    const parsedOrigin = parseCityStateFromAddress(originCity, originState, originAddress);
    const parsedDest = parseCityStateFromAddress(destCity, destState, destAddress);

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
    });

    mapInstanceRef.current = map;

    // Esri World Light Gray Base (Clean Turvo aesthetic, free, no API key, NO watermark)
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 16,
        attribution: "",
      }
    ).addTo(map);

    // Esri World Light Gray Reference (Highway, state, and city labels)
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 16,
        attribution: "",
      }
    ).addTo(map);

    // Add minimal zoom controls in top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Origin Custom Pin (Emerald Green)
    const originIcon = L.divIcon({
      className: "custom-leaflet-pin",
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background-color: #10b981;
            border: 2.5px solid #ffffff;
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.6), 0 2px 5px rgba(0,0,0,0.3);
          "></div>
          <span style="
            margin-top: 4px;
            background-color: #064e3b;
            color: #ecfdf5;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            font-family: system-ui, sans-serif;
          ">
            Pickup: ${parsedOrigin.city || originCity || "Origin"}
          </span>
        </div>
      `,
      iconSize: [100, 40],
      iconAnchor: [50, 7],
    });

    const originMarker = L.marker(originCoords, { icon: originIcon }).addTo(map);
    originMarker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; padding: 4px;">
        <strong style="color: #064e3b; font-size: 12px;">ORIGIN PICKUP</strong><br/>
        <span style="font-size: 11px; color: #374151;">${originFacility || "Shipper Facility"}</span><br/>
        <span style="font-size: 11px; color: #6b7280;">${parsedOrigin.city || originCity || ""}, ${parsedOrigin.state || originState || ""}</span>
      </div>
    `);

    // Destination Custom Pin (Rose Red Flag)
    const destIcon = L.divIcon({
      className: "custom-leaflet-pin",
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background-color: #ef4444;
            border: 2.5px solid #ffffff;
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.6), 0 2px 5px rgba(0,0,0,0.3);
          "></div>
          <span style="
            margin-top: 4px;
            background-color: #881337;
            color: #fff1f2;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            font-family: system-ui, sans-serif;
          ">
            Drop: ${parsedDest.city || destCity || "Destination"}
          </span>
        </div>
      `,
      iconSize: [100, 40],
      iconAnchor: [50, 7],
    });

    const destMarker = L.marker(destCoords, { icon: destIcon }).addTo(map);
    destMarker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; padding: 4px;">
        <strong style="color: #881337; font-size: 12px;">DESTINATION DELIVERY</strong><br/>
        <span style="font-size: 11px; color: #374151;">${destFacility || "Consignee Dock"}</span><br/>
        <span style="font-size: 11px; color: #6b7280;">${parsedDest.city || destCity || ""}, ${parsedDest.state || destState || ""}</span>
      </div>
    `);

    // Driver Ping Location Marker (If Available)
    if (driverLat != null && driverLng != null) {
      const driverIcon = L.divIcon({
        className: "custom-leaflet-pin",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background-color: #2563eb;
              border: 3px solid #ffffff;
              box-shadow: 0 0 12px rgba(37, 99, 235, 0.8), 0 2px 6px rgba(0,0,0,0.3);
              animation: pulse 2s infinite;
            "></div>
            <span style="
              margin-top: 4px;
              background-color: #1e3a8a;
              color: #dbeafe;
              font-size: 10px;
              font-weight: 700;
              padding: 2px 6px;
              border-radius: 4px;
              white-space: nowrap;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
              font-family: system-ui, sans-serif;
            ">
              Live Truck
            </span>
          </div>
        `,
        iconSize: [80, 40],
        iconAnchor: [40, 8],
      });

      L.marker([driverLat, driverLng], { icon: driverIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: system-ui, sans-serif; padding: 4px;">
            <strong style="color: #1e3a8a; font-size: 12px;">LIVE DRIVER LOCATION</strong><br/>
            <span style="font-size: 11px; color: #374151;">Active Telemetry GPS Ping</span>
          </div>
        `);
    }

    // Helper to safely notify parent only when route result changes
    const reportRoute = (distanceMiles: number, source: "osrm" | "haversine", durationText?: string) => {
      const last = lastReportedRef.current;
      if (
        !last ||
        last.miles !== distanceMiles ||
        last.source !== source ||
        last.duration !== durationText
      ) {
        lastReportedRef.current = { miles: distanceMiles, source, duration: durationText };
        onRouteCalculatedRef.current?.({
          distanceMiles,
          durationText,
          source,
        });
      }
    };

    // Immediate fallback route and distance calculation (geodesic straight line)
    const fallbackMiles = calculateHaversineDistanceMiles(originCoords, destCoords);
    const straightLineRoute: [number, number][] = [originCoords, destCoords];

    let glowPolyline: L.Polyline | null = null;

    let routePolyline: L.Polyline = L.polyline(straightLineRoute, {
      color: "#2563eb",
      weight: 3,
      opacity: 0.85,
      dashArray: "6, 8",
    }).addTo(map);

    // Initial bounds fitting
    const initialBounds = L.latLngBounds([originCoords, destCoords]);
    if (driverLat != null && driverLng != null) {
      initialBounds.extend([driverLat, driverLng]);
    }
    map.fitBounds(initialBounds, {
      padding: [48, 48],
      maxZoom: 9,
    });

    // Provide initial distance
    reportRoute(fallbackMiles, "haversine");

    // Fetch real road-following highway route from free public OSRM API
    const abortController = new AbortController();

    async function fetchOsrmRoadRoute() {
      try {
        const originLngCoord = originCoords[1];
        const originLatCoord = originCoords[0];
        const destLngCoord = destCoords[1];
        const destLatCoord = destCoords[0];

        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLngCoord},${originLatCoord};${destLngCoord},${destLatCoord}?overview=full&geometries=geojson`;

        const response = await fetch(osrmUrl, { signal: abortController.signal });
        if (!response.ok) {
          throw new Error(`OSRM API responded with status ${response.status}`);
        }

        const data = await response.json();

        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distanceMeters = route.distance;
          const distanceMiles = Math.round(distanceMeters * 0.000621371);
          const durationText = route.duration ? formatDuration(route.duration) : undefined;

          // Notify parent of driving miles and duration
          reportRoute(distanceMiles, "osrm", durationText);

          // Convert GeoJSON coordinates [lng, lat] to Leaflet format [lat, lng]
          const roadPoints: [number, number][] = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );

          if (roadPoints.length > 0) {
            // Replace straight line fallback with real road geometry
            if (glowPolyline) {
              map.removeLayer(glowPolyline);
            }
            map.removeLayer(routePolyline);

            // Glow underlay
            glowPolyline = L.polyline(roadPoints, {
              color: "#93c5fd",
              weight: 7,
              opacity: 0.5,
              lineCap: "round",
              lineJoin: "round",
            }).addTo(map);

            // Primary road polyline
            routePolyline = L.polyline(roadPoints, {
              color: "#2563eb",
              weight: 4,
              opacity: 0.85,
              lineCap: "round",
              lineJoin: "round",
            }).addTo(map);

            // Auto-fit bounds to the exact road path
            const routeBounds = routePolyline.getBounds();
            if (driverLat != null && driverLng != null) {
              routeBounds.extend([driverLat, driverLng]);
            }
            map.fitBounds(routeBounds, {
              padding: [48, 48],
              maxZoom: 14,
            });
          }
        }
      } catch (err) {
        if ((err as { name?: string }).name !== "AbortError") {
          console.warn("OSRM routing unavailable, using geodesic fallback:", err);
          const safeMiles = calculateHaversineDistanceMiles(originCoords, destCoords);
          reportRoute(safeMiles, "haversine");
        }
      }
    }

    fetchOsrmRoadRoute();

    // Clean up map instance & abort pending network requests on unmount
    return () => {
      abortController.abort();
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
    };
  }, [
    originCity,
    originState,
    originAddress,
    originFacility,
    originLat,
    originLng,
    destCity,
    destState,
    destAddress,
    destFacility,
    destLat,
    destLng,
    driverLat,
    driverLng,
  ]);

  return (
    <div
      ref={mapContainerRef}
      className={`h-full w-full min-h-[300px] z-0 ${className}`}
      style={{ background: "#f8fafc" }}
    />
  );
}

export default RouteLeafletMap;
