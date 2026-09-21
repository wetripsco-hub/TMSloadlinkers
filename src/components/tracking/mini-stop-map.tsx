"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MiniStopMapProps {
  lat: number;
  lng: number;
  type: "pickup" | "delivery";
  isDark?: boolean;
  onOpenMap?: () => void;
}

export function MiniStopMap({ lat, lng, type, isDark = false, onOpenMap }: MiniStopMapProps) {
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
      center: [lat, lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
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

      // Reference labels
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 16,
        }
      ).addTo(map);
    }

    // Custom Ring Pin matching Turvo Driver App screenshots
    const isPickup = type === "pickup";
    const ringColor = isPickup ? "#16a34a" : "#dc2626";

    const customPin = L.divIcon({
      className: "mini-stop-pin",
      html: `
        <div style="
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 4px solid ${ringColor};
          background-color: #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 4px; height: 4px; border-radius: 50%; background-color: ${ringColor};"></div>
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    L.marker([lat, lng], { icon: customPin }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, type, isDark]);

  return (
    <div
      onClick={onOpenMap}
      role="button"
      tabIndex={0}
      title="Click to view full route map"
      className="relative w-full h-28 sm:h-32 cursor-pointer overflow-hidden group select-none"
    >
      <div ref={containerRef} className="w-full h-full" />
      {/* Subtle overlay gradient on hover */}
      <div className="absolute inset-0 bg-transparent group-hover:bg-blue-600/5 transition-colors pointer-events-none" />
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white/90 shadow-sm pointer-events-none">
        Map
      </div>
    </div>
  );
}

export default MiniStopMap;
