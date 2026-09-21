"use client";

import React from "react";
import type { SolutionCard } from "@/types/loadlinkers";

const solutions: Omit<SolutionCard, "href">[] = [
  {
    id: "3pls",
    title: "3PLs",
    description:
      "Loadlinkers helps provide 3x more revenue, 5x more shipments, and 50% fewer manual updates for 10x better fleet utilization.",
    bgImage: "/images/solutions/bg-3pls.jpg",
    ariaLabel: "Loadlinkers - 3PLs Solution",
  },
  {
    id: "brokers",
    title: "Freight Brokers",
    description:
      "Loadlinkers delivers real-time intelligence while allowing brokers to streamline services and maintain complete control.",
    bgImage: "/images/solutions/bg-brokers.jpg",
    ariaLabel: "Loadlinkers freight brokers",
  },
  {
    id: "shippers",
    title: "Shippers",
    description:
      "Loadlinkers offers intelligence-driven collaboration for lower transportation costs, improved capabilities, and higher efficiency gains.",
    bgImage: "/images/solutions/bg-shippers.jpg",
    ariaLabel: "Loadlinkers - Shippers",
  },
  {
    id: "carriers",
    title: "Carriers",
    description:
      "Loadlinkers allows carriers to identify chokepoints with automated service solutions and unparalleled shipment visibility.",
    bgImage: "/images/solutions/bg-carriers.jpg",
    ariaLabel: "Loadlinkers - Carriers",
  },
];

export function WhoLoadlinkersPowers() {
  return (
    <section id="who-loadlinkers-powers" className="py-16 sm:py-24 bg-slate-50 relative border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="text-center space-y-3 mb-12 sm:mb-16">
          <div className="inline-block">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full">
              Loadlinkers Process Solutions
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Who Loadlinkers Powers
          </h2>
        </div>

        {/* 4-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {solutions.map((item) => (
            <div
              key={item.id}
              className="group relative h-[420px] rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-end p-6 sm:p-7"
            >
              {/* Background Image with Zoom */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ backgroundImage: `url(${item.bgImage})` }}
                role="img"
                aria-label={item.ariaLabel}
              />

              {/* Gradient Overlay for Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-black/20 group-hover:via-slate-950/80 transition-all duration-300" />

              {/* Content */}
              <div className="relative z-10 space-y-3">
                <h3 className="text-2xl font-bold text-white tracking-tight group-hover:text-blue-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed line-clamp-4">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Backwards compatibility alias
export const WhoTurvoPowers = WhoLoadlinkersPowers;
