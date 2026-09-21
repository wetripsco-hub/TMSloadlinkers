"use client";

import React, { useState } from "react";
import { Play, X } from "lucide-react";

export function CustomerVideoSpotlight() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="py-16 sm:py-24 bg-white border-t border-slate-200/80 relative text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Column: Heading & Button */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <span className="inline-block text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full">
              Customer Success
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Port X Logistics Grows Profits Through Productivity
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Discover how Port X Logistics streamlined complex port drayage and supply chain visibility, empowered teams, and achieved substantial profitability gains with Loadlinkers.
            </p>
          </div>

          {/* Right Column: Video Player Thumbnail */}
          <div className="lg:col-span-6">
            <div
              onClick={() => setIsOpen(true)}
              className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xl group cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label="Play Port X Customer Story Video"
            >
              <img
                src="/images/resources/portx-video-thumb.jpg"
                alt="Port X Customer Story"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-600/95 group-hover:bg-blue-600 group-hover:scale-110 flex items-center justify-center shadow-xl transition-all duration-300">
                  <Play className="w-7 h-7 sm:w-9 sm:h-9 text-white fill-white translate-x-0.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal Lightbox */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white rounded-full bg-black/60 hover:bg-black/80 transition-colors"
              aria-label="Close video"
            >
              <X className="w-6 h-6" />
            </button>
            <iframe
              src="https://www.youtube-nocookie.com/embed/VhZKelr7i2s?autoplay=1"
              title="Port X Logistics Customer Story"
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
