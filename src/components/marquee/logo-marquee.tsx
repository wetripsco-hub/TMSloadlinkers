"use client";

import React from "react";
import Link from "next/link";
import { PartnerLogo } from "@/types/turvo";

const partnerLogos: PartnerLogo[] = [
  { name: "Lineage", imageSrc: "/images/logos/lineage.png", href: "#lineage" },
  { name: "Ryder", imageSrc: "/images/logos/ryder.png", href: "#ryder" },
  { name: "Zengistics", imageSrc: "/images/logos/zengistics.png", href: "#zengistics" },
  { name: "Cardinal", imageSrc: "/images/logos/cardinal.png", href: "#cardinal" },
  { name: "PortCity", imageSrc: "/images/logos/portcity.png", href: "#portcity" },
  { name: "Veritas", imageSrc: "/images/logos/veritas.png", href: "#veritas" },
  { name: "Gebrüder Weiss", imageSrc: "/images/logos/gw.png", href: "#gw" },
  { name: "Best Bay", imageSrc: "/images/logos/bestbay.png", href: "#bestbay" },
  { name: "RPM", imageSrc: "/images/logos/rpm.png", href: "#rpm" },
  { name: "Transloop", imageSrc: "/images/logos/transloop.png", href: "#transloop" },
  { name: "PortX", imageSrc: "/images/logos/portx.png", href: "#portx" },
];

export function LogoMarquee() {
  const duplicatedLogos = [...partnerLogos, ...partnerLogos];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-r from-[#17325b]/60 via-[#0b7cc1]/40 to-[#17325b]/60 border-y border-white/10 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 bg-[#18171d]/60 backdrop-blur-sm pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center mb-10">
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
          Trusted by <span className="text-[#00d084] font-extrabold">thousands</span> of logistics operators
        </h3>
      </div>

      {/* Infinite Marquee Track */}
      <div className="relative w-full overflow-hidden z-10">
        {/* Gradient fade masks on sides */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#18171d] to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#18171d] to-transparent z-20 pointer-events-none" />

        <div className="animate-marquee flex items-center gap-12 sm:gap-16 py-2">
          {duplicatedLogos.map((partner, index) => (
            <Link
              key={`${partner.name}-${index}`}
              href={partner.href}
              className="flex-shrink-0 h-10 sm:h-12 w-36 sm:w-44 flex items-center justify-center grayscale opacity-75 hover:grayscale-0 hover:opacity-100 transition-all duration-300 transform hover:scale-105"
            >
              <img
                src={partner.imageSrc}
                alt={partner.name}
                className="max-h-full max-w-full object-contain filter brightness-100 invert"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
