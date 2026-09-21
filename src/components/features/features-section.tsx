"use client";

import React from "react";
import {
  KanbanSquare,
  ShieldCheck,
  ScanLine,
  Landmark,
  MapPin,
  Users2,
} from "lucide-react";

const features = [
  {
    icon: Users2,
    title: "Built for how you actually work",
    description:
      "Choose Freight Brokerage, Truck Dispatch, or Hybrid mode at setup. Loadlinkers adapts the financial fields and workflows you see — not a one-size-fits-all TMS forcing broker math on a dispatch operation.",
    highlight: true,
  },
  {
    icon: KanbanSquare,
    title: "Load management, your way",
    description:
      "Switch between a drag-and-drop Kanban board and a sortable table view — dispatch, update status, and manage every load from whichever view fits how you work that day.",
  },
  {
    icon: ShieldCheck,
    title: "Carrier verification & compliance",
    description:
      "FMCSA-backed compliance checks flag expired insurance, inactive authority, and unsatisfactory safety ratings before a carrier is ever assigned to a load.",
  },
  {
    icon: ScanLine,
    title: "Document intelligence & OCR",
    description:
      "Upload a signed Rate Confirmation or proof of delivery and OCR extracts the details automatically — review, confirm, and move on instead of retyping a PDF.",
  },
  {
    icon: Landmark,
    title: "Financials & settlements",
    description:
      "Generate shipper invoices and carrier settlements straight from delivered loads, with QuickBooks and CSV export built in for your books.",
  },
  {
    icon: MapPin,
    title: "Tracking & telematics",
    description:
      "Share a tokenized live tracking link with your customer — real-time milestone and location updates, no login or app download required on their end.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="text-center space-y-3 mb-14 sm:mb-20">
          <div className="inline-block">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full">
              Features
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Everything Your Dispatch Operation Needs
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            One platform covering load management, compliance, documents, financials, and tracking.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`rounded-2xl p-6 bg-white border shadow-xs hover:shadow-md transition-all duration-300 ${
                feature.highlight ? "border-2 border-blue-600 ring-4 ring-blue-50" : "border-slate-200/80"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-5">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
