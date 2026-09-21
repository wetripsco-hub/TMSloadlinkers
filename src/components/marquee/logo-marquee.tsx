"use client";

import React from "react";
import type { PartnerLogo } from "@/types/turvo";

const partnerLogos: Omit<PartnerLogo, "href">[] = [
  { name: "Lineage", imageSrc: "/images/logos/lineage.png" },
  { name: "Ryder", imageSrc: "/images/logos/ryder.png" },
  { name: "Zengistics", imageSrc: "/images/logos/zengistics.png" },
  { name: "Cardinal", imageSrc: "/images/logos/cardinal.png" },
  { name: "PortCity", imageSrc: "/images/logos/portcity.png" },
  { name: "Veritas", imageSrc: "/images/logos/veritas.png" },
  { name: "Gebrüder Weiss", imageSrc: "/images/logos/gw.png" },
  { name: "Best Bay", imageSrc: "/images/logos/bestbay.png" },
  { name: "RPM", imageSrc: "/images/logos/rpm.png" },
  { name: "Transloop", imageSrc: "/images/logos/transloop.png" },
  { name: "PortX", imageSrc: "/images/logos/portx.png" },
];

export function LogoMarquee() {
  const duplicatedLogos = [...partnerLogos, ...partnerLogos];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-50/70 via-slate-100 to-blue-50/70 border-y border-slate-200 relative overflow-hidden text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center mb-10">
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
          Trusted by <span className="text-emerald-600 font-extrabold">thousands</span> of logistics operators
        </h3>
      </div>

      {/* Infinite Marquee Track */}
      <div className="relative w-full overflow-hidden z-10">
        {/* Gradient fade masks on sides */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-100 to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-100 to-transparent z-20 pointer-events-none" />

        <div className="animate-marquee flex items-center gap-12 sm:gap-16 py-2">
          {duplicatedLogos.map((partner, index) => (
            <div
              key={`${partner.name}-${index}`}
              className="flex-shrink-0 h-10 sm:h-12 w-36 sm:w-44 flex items-center justify-center grayscale opacity-80 transition-all duration-300"
            >
              <img
                src={partner.imageSrc}
                alt={partner.name}
                className="max-h-full max-w-full object-contain filter contrast-125"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
