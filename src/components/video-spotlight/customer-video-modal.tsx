"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const APP_SCREENSHOTS = [
  {
    src: "/images/screenshots/screenshot-dashboard.png",
    alt: "FreightLink operations dashboard with KPI tiles",
    label: "Operations Dashboard",
  },
  {
    src: "/images/screenshots/screenshot-loads.png",
    alt: "Loads management table view",
    label: "Loads Management",
  },
  {
    src: "/images/screenshots/screenshot-load-detail.png",
    alt: "Load detail page with route map and financial summary",
    label: "Load Detail & Route Map",
  },
  {
    src: "/images/screenshots/screenshot-carriers.png",
    alt: "Carrier compliance verification with FMCSA badges",
    label: "Carrier Compliance",
  },
  {
    src: "/images/screenshots/screenshot-tracking.png",
    alt: "Driver live tracking view",
    label: "Live Tracking",
  },
];

const AUTOPLAY_INTERVAL = 4000;

export function CustomerVideoSpotlight() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  function next() {
    setActive((i) => (i + 1) % APP_SCREENSHOTS.length);
  }

  function prev() {
    setActive((i) => (i - 1 + APP_SCREENSHOTS.length) % APP_SCREENSHOTS.length);
  }

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % APP_SCREENSHOTS.length);
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(id);
  }, [paused]);

  const shot = APP_SCREENSHOTS[active];

  return (
    <section className="py-16 sm:py-24 bg-white border-t border-slate-200/80 relative text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Column: Heading */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            <span className="inline-block text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full">
              Platform Tour
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Everything you need in one collaborative workspace
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              From real-time load dispatch and carrier compliance to live GPS tracking and automated settlements — FreightLink puts your full operation on one screen.
            </p>

            {/* Dot navigation */}
            <div className="flex items-center gap-3 justify-center lg:justify-start pt-2">
              {APP_SCREENSHOTS.map((s, i) => (
                <button
                  key={s.label}
                  onClick={() => { setActive(i); setPaused(true); }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === active
                      ? "w-6 bg-blue-600"
                      : "w-2 bg-slate-300 hover:bg-slate-400"
                  }`}
                  aria-label={`View ${s.label}`}
                />
              ))}
            </div>

            {/* Label */}
            <p className="text-sm font-semibold text-blue-700 tracking-wide uppercase">
              {shot.label}
            </p>
          </div>

          {/* Right Column: Screenshot carousel */}
          <div
            className="lg:col-span-7"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xl group aspect-video">
              {APP_SCREENSHOTS.map((s, i) => (
                <img
                  key={s.src}
                  src={s.src}
                  alt={s.alt}
                  className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ${
                    i === active ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                />
              ))}

              {/* Prev / Next arrows */}
              <button
                onClick={() => { prev(); setPaused(true); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                aria-label="Previous screenshot"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => { next(); setPaused(true); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                aria-label="Next screenshot"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Bottom label strip */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/60 to-transparent px-4 py-3 pointer-events-none">
                <p className="text-xs font-semibold text-white/90 tracking-wide uppercase">
                  {shot.label}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
