"use client";

import React from "react";
import Link from "next/link";

export function NextStepCTA() {
  return (
    <section className="py-20 sm:py-28 bg-slate-100 relative overflow-hidden border-t border-slate-200/80 text-center">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-200/50 via-sky-200/50 to-blue-200/50 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 relative z-10 space-y-8">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Take the
          <br />
          Next Step
        </h2>

        <div>
          <Link
            href="#pricing"
            className="inline-flex items-center justify-center px-9 py-4 rounded-full text-xs sm:text-sm font-bold uppercase tracking-widest turvo-gradient-btn shadow-xl hover:shadow-2xl transition-all"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}
