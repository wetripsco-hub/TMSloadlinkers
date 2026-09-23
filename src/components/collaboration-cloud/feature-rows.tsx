"use client";

import React from "react";
import type { FeatureRow } from "@/types/turvo";

const featureRows: Omit<FeatureRow, "ctaText" | "ctaHref">[] = [
  {
    id: "collab-cloud",
    eyebrow: "Loadlinkers Collaboration Cloud",
    title: "Loadlinkers Collaboration Cloud",
    description:
      "Loadlinkers delivers a SaaS cloud transportation management software with a unique collaboration layer that unifies people, processes, and data — connecting every stakeholder in every transaction along your supply chain. Easily integrate WMS, TMS, ERP, load boards, freight rates, and other solutions. Elevate your data into Loadlinkers for google-like search capabilities, real-time actionable insights, and interactions from one single view.",
    imageSrc: "/images/features/collaboration-cloud.png",
    imageAlt: "Loadlinkers Collaboration cloud platform diagram",
    reverse: false,
  },
  {
    id: "tms-execution",
    eyebrow: "Transportation Management Software",
    title: "Transportation Management Software",
    description:
      "Automate order-to-shipment activities while eliminating check calls, texts, and emails. Reduce freight management costs and ship faster with 100% traceability, live tracking, and predictive planning through tighter inventory controls.",
    imageSrc: "/images/screenshots/screenshot-loads.png",
    imageAlt: "FreightLink TMS loads management interface",
    reverse: true,
  },
  {
    id: "grow-roi",
    eyebrow: "Grow Your ROI",
    title: "Grow Your ROI",
    description:
      "Loadlinkers’s cloud-based collaboration and efficiency tools give you the analytics, insights, and communication infrastructure to cut inefficiencies, increase your revenue, and scale on your terms.",
    imageSrc: "/images/features/grow-roi.png",
    imageAlt: "Grow ROI with Loadlinkers analytics and tools",
    reverse: false,
  },
];

export function CollaborationCloud() {
  return (
    <section className="py-16 sm:py-24 bg-white border-b border-slate-200/80 relative text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="text-center space-y-3 mb-16 sm:mb-24">
          <div className="inline-block">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full">
              Loadlinkers Collaboration Cloud
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            A Fully Connected Way to
            <br />
            Rise Above the Chaos
          </h2>
        </div>

        {/* Feature Rows */}
        <div className="space-y-20 sm:space-y-32">
          {featureRows.map((row) => (
            <div
              key={row.id}
              className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center ${
                row.reverse ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Image Side */}
              <div
                className={`lg:col-span-6 ${
                  row.reverse ? "lg:order-2" : "lg:order-1"
                }`}
              >
                <div className="relative rounded-2xl p-3 bg-slate-50 border border-slate-200 shadow-xl turvo-card-hover group">
                  <img
                    src={row.imageSrc}
                    alt={row.imageAlt}
                    className="w-full h-auto rounded-xl object-contain group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
              </div>

              {/* Text Side */}
              <div
                className={`lg:col-span-6 space-y-6 ${
                  row.reverse ? "lg:order-1" : "lg:order-2"
                }`}
              >
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                  {row.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {row.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
