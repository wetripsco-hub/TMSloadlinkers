"use client";

import React from "react";
import { StartTrialButton } from "@/components/pricing/start-trial-button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pb-24 lg:pt-16 lg:pb-32 bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 border-b border-slate-200/80">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-sky-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            <div className="inline-block">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full">
                Cloud-Powered Collaboration
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              The #1 Modern
              <br />
              <span className="text-slate-900">TMS Solution</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
              With a concerted approach to supply chain management, Loadlinkers provides{" "}
              <span className="whitespace-nowrap text-slate-900 font-semibold">end-to-end</span> communication
              and analytics solutions for freight brokers, 3PLs, shippers, and carriers.
            </p>

            <div className="pt-2">
              <StartTrialButton className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-sm font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]">
                Start Your Free 7-Day Trial
              </StartTrialButton>
            </div>
          </div>

          {/* Right Column: Platform UI Preview Card */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl p-2 sm:p-3 bg-white border border-slate-200/90 shadow-2xl">
              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-900">
                <img
                  src="/images/screenshots/screenshot-dashboard.png"
                  alt="FreightLink operations dashboard"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/hero/hero-fallback.png";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
