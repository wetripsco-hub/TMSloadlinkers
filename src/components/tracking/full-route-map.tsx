"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, X, Locate, Navigation, ExternalLink } from "lucide-react";

interface FullRouteMapProps {
  origin: {
    lat: number;
    lng: number;
    title: string;
    address?: string;
  };
  destination: {
    lat: number;
    lng: number;
    title: string;
    address?: string;
  };
  driverLocation?: {
    lat: number;
    lng: number;
  } | null;
  loadNumber?: string | null;
  isDark?: boolean;
  mapsUrl?: string;
  onClose: () => void;
}

export function FullRouteMap({
  origin,
  destination,
  driverLocation,
  loadNumber,
  isDark = false,
  mapsUrl,
  onClose,
}: FullRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Reset container if previously mounted
    const container = containerRef.current as unknown as { _leaflet_id?: unknown };
    if (container._leaflet_id) {
      delete container._leaflet_id;
    }

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    });
    mapRef.current = map;

    // Base Tile Layer
    if (isDark) {
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 18,
          subdomains: "abcd",
        }
      ).addTo(map);
    } else {
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 16,
        }
      ).addTo(map);

      // Highway and label overlay
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 16,
        }
      ).addTo(map);
    }

    // Zoom control in bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Custom Origin Pin (Green Ring Pin)
    const originPin = L.divIcon({
      className: "origin-stop-pin",
      html: `
        <div style="
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 4.5px solid #16a34a;
          background-color: #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #16a34a;"></div>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    const originMarker = L.marker([origin.lat, origin.lng], { icon: originPin }).addTo(map);
    originMarker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; padding: 2px;">
        <span style="font-size: 10px; font-weight: 700; color: #16a34a; text-transform: uppercase;">Pickup</span>
        <div style="font-size: 12px; font-weight: 600; color: #0f172a;">${origin.title}</div>
        ${origin.address ? `<div style="font-size: 11px; color: #64748b;">${origin.address}</div>` : ""}
      </div>
    `);

    // Custom Destination Pin (Red Ring Pin)
    const destPin = L.divIcon({
      className: "dest-stop-pin",
      html: `
        <div style="
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 4.5px solid #dc2626;
          background-color: #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #dc2626;"></div>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    const destMarker = L.marker([destination.lat, destination.lng], { icon: destPin }).addTo(map);
    destMarker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; padding: 2px;">
        <span style="font-size: 10px; font-weight: 700; color: #dc2626; text-transform: uppercase;">Delivery</span>
        <div style="font-size: 12px; font-weight: 600; color: #0f172a;">${destination.title}</div>
        ${destination.address ? `<div style="font-size: 11px; color: #64748b;">${destination.address}</div>` : ""}
      </div>
    `);

    // Points to bound
    const points: [number, number][] = [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ];

    // Driver Location Pin (Black / Blue navigation target)
    if (driverLocation) {
      points.push([driverLocation.lat, driverLocation.lng]);

      const driverPin = L.divIcon({
        className: "driver-loc-pin",
        html: `
          <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
            <div style="
              position: absolute;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              background-color: rgba(37, 99, 235, 0.25);
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 3px solid #ffffff;
              background-color: #1d4ed8;
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ffffff;"></div>
            </div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const driverMarker = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverPin }).addTo(map);
      driverMarker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; padding: 2px;">
          <span style="font-size: 10px; font-weight: 700; color: #1d4ed8; text-transform: uppercase;">Vehicle Position</span>
          <div style="font-size: 11px; color: #475569;">${driverLocation.lat.toFixed(4)}, ${driverLocation.lng.toFixed(4)}</div>
        </div>
      `);
    }

    // Fit Bounds with padding
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [origin, destination, driverLocation, isDark]);

  function handleCenter() {
    if (!mapRef.current) return;
    const target = driverLocation ? [driverLocation.lat, driverLocation.lng] as [number, number] : [origin.lat, origin.lng] as [number, number];
    mapRef.current.setView(target, 14, { animate: true });
  }

  function handleFitAll() {
    if (!mapRef.current) return;
    const points: [number, number][] = [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ];
    if (driverLocation) points.push([driverLocation.lat, driverLocation.lng]);
    mapRef.current.fitBounds(L.latLngBounds(points), { padding: [60, 60] });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 animate-in fade-in duration-200">
      {/* Top Header Bar matching Screenshot 2 */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm text-slate-900">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            aria-label="Back to route plan"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            aria-label="Close map"
          >
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold tracking-tight text-slate-900">
            Map
          </h1>
        </div>

        <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {loadNumber ? `#${loadNumber}` : "Active Route"}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative flex-1 w-full h-full">
        <div ref={containerRef} className="w-full h-full" />

        {/* Quick Action Floating Buttons on Map */}
        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
          <button
            onClick={handleCenter}
            className="w-10 h-10 rounded-xl bg-white text-slate-700 hover:text-blue-600 shadow-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer"
            title="Center on Vehicle"
            aria-label="Center on Vehicle"
          >
            <Locate className="w-5 h-5" />
          </button>
          <button
            onClick={handleFitAll}
            className="w-10 h-10 rounded-xl bg-white text-slate-700 hover:text-blue-600 shadow-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer"
            title="Fit Route"
            aria-label="Fit Route"
          >
            <Navigation className="w-5 h-5" />
          </button>
        </div>

        {/* Route Bottom Pill */}
        <div className="absolute bottom-6 left-4 right-4 z-[400] max-w-md mx-auto">
          <div className="p-3.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl border border-slate-200/90 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-semibold text-slate-800 truncate">{origin.title}</span>
              <span className="text-slate-400 shrink-0">&rarr;</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span className="font-semibold text-slate-800 truncate">{destination.title}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in Maps
                </a>
              )}
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer"
              >
                Back to Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FullRouteMap;
