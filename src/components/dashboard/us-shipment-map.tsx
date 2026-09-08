"use client";

import React, { useState } from "react";
import { US_STATES_MAP_DATA, type UsStatePath } from "./us-map-data";

export interface UsShipmentMapProps {
  pickupCounts: Record<string, number>;
  deliveryCounts: Record<string, number>;
  totalPickups?: number;
  totalDeliveries?: number;
}

export function UsShipmentMap({
  pickupCounts = {},
  deliveryCounts = {},
  totalPickups = 0,
  totalDeliveries = 0,
}: UsShipmentMapProps) {
  const [activeTab, setActiveTab] = useState<"pickups" | "deliveries">("pickups");
  const [hoveredState, setHoveredState] = useState<{
    code: string;
    name: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const activeCounts = activeTab === "pickups" ? pickupCounts : deliveryCounts;
  const currentTotal = activeTab === "pickups" ? totalPickups : totalDeliveries;
  const tabLabel = activeTab === "pickups" ? "Pickups" : "Deliveries";
  const singularTabLabel = activeTab === "pickups" ? "Pickup" : "Delivery";

  // Color gradient interpolation based on shipment count
  const getStateColor = (count: number): string => {
    if (!count || count <= 0) return "#e2e8f0"; // slate-200 (0 shipments)
    if (count <= 2) return "#93c5fd"; // blue-300 (1-2 shipments)
    if (count <= 5) return "#3b82f6"; // blue-500 (3-5 shipments)
    return "#1d4ed8"; // blue-700 corporate navy (6+ shipments)
  };

  const handleMouseMove = (
    e: React.MouseEvent<SVGPathElement>,
    state: UsStatePath,
    count: number
  ) => {
    const rect = e.currentTarget.closest("svg")?.getBoundingClientRect();
    if (!rect) return;

    setHoveredState({
      code: state.id,
      name: state.name,
      count,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="relative flex flex-col rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
      {/* Header with Title & Pickups/Deliveries Segmented Control */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
            Total shipments
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentTotal} total {tabLabel.toLowerCase()} across US lower 48 & territories
          </p>
        </div>

        {/* Segmented Control */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("pickups")}
            className={`transition-colors pb-1 relative cursor-pointer ${
              activeTab === "pickups"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Pickups
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("deliveries")}
            className={`transition-colors pb-1 relative cursor-pointer ${
              activeTab === "deliveries"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Deliveries
          </button>
        </div>
      </div>

      {/* SVG Map Canvas Container */}
      <div className="relative w-full flex items-center justify-center pt-2 pb-1">
        <svg
          viewBox="0 0 959 593"
          className="w-full h-auto max-h-[440px] select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g>
            {US_STATES_MAP_DATA.map((state) => {
              const count = activeCounts[state.id] || 0;
              const fillColor = getStateColor(count);
              const isHovered = hoveredState?.code === state.id;

              return (
                <path
                  key={state.id}
                  d={state.path}
                  fill={fillColor}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? "2" : "1.2"}
                  strokeLinejoin="round"
                  className="transition-colors duration-150 cursor-pointer outline-hidden hover:opacity-90"
                  onMouseEnter={(e) => handleMouseMove(e, state, count)}
                  onMouseMove={(e) => handleMouseMove(e, state, count)}
                  onMouseLeave={() => setHoveredState(null)}
                />
              );
            })}
          </g>
        </svg>

        {/* Floating Tooltip */}
        {hoveredState && (
          <div
            className="pointer-events-none absolute z-30 rounded-lg bg-slate-900/95 px-3 py-1.5 text-xs text-white shadow-xl backdrop-blur-xs border border-slate-700/80 -translate-x-1/2 -translate-y-full mb-2"
            style={{
              left: `${hoveredState.x}px`,
              top: `${hoveredState.y}px`,
            }}
          >
            <div className="font-bold text-slate-100">{hoveredState.name}</div>
            <div className="text-[11px] text-slate-300 font-medium">
              {hoveredState.count}{" "}
              {hoveredState.count === 1 ? singularTabLabel : tabLabel}
            </div>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
        <span>Volume Density:</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#e2e8f0] border border-slate-300" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#93c5fd]" />
            <span>1–2</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#3b82f6]" />
            <span>3–5</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#1d4ed8]" />
            <span>6+</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UsShipmentMap;
