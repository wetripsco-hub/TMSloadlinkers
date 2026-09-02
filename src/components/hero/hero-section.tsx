"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Play, X } from "lucide-react";

export function HeroSection() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  return (
    <section className="relative overflow-hidden pt-6 pb-16 sm:pb-24 lg:pt-12 lg:pb-32 bg-[#18171d]">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#2b7ee2]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-[#49c2f5]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            <div className="inline-block">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#49c2f5]">
                Cloud-Powered Collaboration
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              The #1 Modern
              <br />
              <span className="text-white">TMS Solution</span>
            </h1>

            <p className="text-base sm:text-lg text-[#a0a0aa] leading-relaxed max-w-xl mx-auto lg:mx-0">
              With a concerted approach to supply chain management, Loadlinkers provides{" "}
              <span className="whitespace-nowrap text-white/90 font-medium">end-to-end</span> communication
              and analytics solutions for freight brokers, 3PLs, shippers, and carriers.
            </p>

            <div className="pt-2">
              <Link
                href="#schedule-demo"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-sm font-bold uppercase tracking-wider turvo-gradient-btn shadow-lg"
              >
                Demo Loadlinkers
              </Link>
            </div>
          </div>

          {/* Right Column: Platform UI Preview Card */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl p-2 sm:p-3 bg-gradient-to-b from-white/15 to-white/5 border border-white/15 shadow-2xl group">
              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-[#111015]">
                <img
                  src="/images/hero/hero-screen.gif"
                  alt="Loadlinkers Collaborative Platform Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/hero/hero-fallback.png";
                  }}
                />

                {/* Dark Gradient Overlay & Play Button */}
                <div
                  onClick={() => setIsVideoModalOpen(true)}
                  className="absolute inset-0 bg-black/20 hover:bg-black/40 transition-colors flex items-center justify-center cursor-pointer group/play"
                  role="button"
                  tabIndex={0}
                  aria-label="Play Product Video"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#49c2f5]/90 group-hover/play:bg-[#49c2f5] group-hover/play:scale-110 flex items-center justify-center shadow-xl transition-all duration-300">
                    <Play className="w-7 h-7 sm:w-9 sm:h-9 text-[#18171d] fill-[#18171d] translate-x-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal Lightbox */}
      {isVideoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white rounded-full bg-black/60 hover:bg-black/80 transition-colors"
              aria-label="Close video"
            >
              <X className="w-6 h-6" />
            </button>
            <iframe
              src="https://www.youtube-nocookie.com/embed/VhZKelr7i2s?autoplay=1"
              title="Loadlinkers TMS Overview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </section>
  );
}
