"use client";

import React from "react";
import Link from "next/link";

export function NextStepCTA() {
  return (
    <section className="py-20 sm:py-28 bg-[#18171d] relative overflow-hidden border-t border-white/10 text-center">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#0b7cc1]/20 via-[#49c2f5]/15 to-[#0b7cc1]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 relative z-10 space-y-8">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Take the
          <br />
          Next Step
        </h2>

        <div>
          <Link
            href="#schedule-demo"
            className="inline-flex items-center justify-center px-9 py-4 rounded-full text-xs sm:text-sm font-bold uppercase tracking-widest turvo-gradient-btn shadow-2xl"
          >
            Schedule A Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
