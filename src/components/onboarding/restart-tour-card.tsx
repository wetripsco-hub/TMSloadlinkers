"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Compass, RotateCcw } from "lucide-react";
import { TOUR_STORAGE_KEY, triggerProductTour } from "./product-tour";

export function RestartTourCard() {
  const router = useRouter();
  const pathname = usePathname();

  const handleRestart = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOUR_STORAGE_KEY);
    }
    if (pathname !== "/overview") {
      router.push("/overview?tour=true");
    } else {
      triggerProductTour();
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              Interactive Dashboard Walkthrough
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 max-w-xl leading-relaxed">
              Replay the guided 5-step walkthrough to review core operations: load dispatching, carrier safety checks, live SMS telematics tracking, and branded invoice remittance.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRestart}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shrink-0 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
          Restart Product Tour
        </button>
      </div>
    </div>
  );
}

export function RestartTourButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleRestart = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOUR_STORAGE_KEY);
    }
    if (pathname !== "/overview") {
      router.push("/overview?tour=true");
    } else {
      triggerProductTour();
    }
  };

  return (
    <button
      type="button"
      onClick={handleRestart}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer ${className}`}
    >
      <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
      Replay Tour
    </button>
  );
}
