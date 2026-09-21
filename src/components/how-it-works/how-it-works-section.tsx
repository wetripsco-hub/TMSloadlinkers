"use client";

import React from "react";
import { UserCog, FileScan, ShieldCheck, MapPinned } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserCog,
    title: "Sign up and choose your mode",
    description:
      "Pick Freight Brokerage, Truck Dispatch, or Hybrid when you set up your organization. Loadlinkers tailors your dashboard and financial fields to match how you actually operate — brokers see margin and shipper rate, dispatchers see carrier pay and settlements.",
  },
  {
    number: "02",
    icon: FileScan,
    title: "Create your first load",
    description:
      "Build a load manually in the load wizard, or upload a signed Rate Confirmation and let OCR extract the carrier, rate, and stop details automatically — no retyping a PDF into a form.",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Verify carriers and dispatch",
    description:
      "Run an FMCSA compliance check before assigning a carrier. Loadlinkers flags expired insurance, inactive authority, and unsatisfactory safety ratings so you never dispatch blind.",
  },
  {
    number: "04",
    icon: MapPinned,
    title: "Track, invoice, and get paid",
    description:
      "Share a live tracking link with your customer while the load is in motion, then generate the shipper invoice and carrier settlement the moment it delivers.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-white border-b border-slate-200/80 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="text-center space-y-3 mb-14 sm:mb-20">
          <div className="inline-block">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full">
              How It Works
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            From Signup to Running Loads
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            No onboarding calls required — here&apos;s exactly what happens after you sign up.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative rounded-2xl p-6 bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <step.icon className="w-6 h-6" />
                </div>
                <span className="text-3xl font-extrabold text-slate-100 tracking-tight">
                  {step.number}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
