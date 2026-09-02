"use client";

import React from "react";
import Link from "next/link";
import { SolutionCard } from "@/types/turvo";

const solutions: SolutionCard[] = [
  {
    id: "3pls",
    title: "3PLs",
    description:
      "Loadlinkers helps provide 3x more revenue, 5x more shipments, and 50% fewer manual updates for 10x better fleet utilization.",
    href: "#3pls",
    bgImage: "/images/solutions/bg-3pls.jpg",
    ariaLabel: "Loadlinkers - 3PLs Solution",
  },
  {
    id: "brokers",
    title: "Freight Brokers",
    description:
      "Loadlinkers delivers real-time intelligence while allowing brokers to streamline services and maintain complete control.",
    href: "#freight-brokers",
    bgImage: "/images/solutions/bg-brokers.jpg",
    ariaLabel: "Loadlinkers freight brokers",
  },
  {
    id: "shippers",
    title: "Shippers",
    description:
      "Loadlinkers offers intelligence-driven collaboration for lower transportation costs, improved capabilities, and higher efficiency gains.",
    href: "#shippers",
    bgImage: "/images/solutions/bg-shippers.jpg",
    ariaLabel: "Loadlinkers - Shippers",
  },
  {
    id: "carriers",
    title: "Carriers",
    description:
      "Loadlinkers allows carriers to identify chokepoints with automated service solutions and unparalleled shipment visibility.",
    href: "#carriers",
    bgImage: "/images/solutions/bg-carriers.jpg",
    ariaLabel: "Loadlinkers - Carriers",
  },
];

export function WhoTurvoPowers() {
  return (
    <section id="who-loadlinkers-powers" className="py-16 sm:py-24 bg-[#18171d] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="text-center space-y-2 mb-12 sm:mb-16">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#49c2f5]">
            Loadlinkers Process Solutions
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Who Loadlinkers Powers
          </h2>
        </div>

        {/* 4-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {solutions.map((item) => (
            <div
              key={item.id}
              className="group relative h-[420px] rounded-2xl overflow-hidden border border-white/15 bg-[#1f1e24] shadow-xl turvo-card-hover flex flex-col justify-end p-6 sm:p-7"
            >
              {/* Background Image with Zoom */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ backgroundImage: `url(${item.bgImage})` }}
                role="img"
                aria-label={item.ariaLabel}
              />

              {/* Gradient Overlay for Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111015] via-[#111015]/80 to-black/30 group-hover:via-[#111015]/90 transition-all duration-300" />

              {/* Content */}
              <div className="relative z-10 space-y-3">
                <h3 className="text-2xl font-bold text-white tracking-tight group-hover:text-[#49c2f5] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#a0a0aa] leading-relaxed line-clamp-4">
                  {item.description}
                </p>
                <div className="pt-2">
                  <Link
                    href={item.href}
                    className="inline-block text-xs font-bold uppercase tracking-wider text-white border-b border-white/40 pb-1 hover:text-[#49c2f5] hover:border-[#49c2f5] transition-all"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
