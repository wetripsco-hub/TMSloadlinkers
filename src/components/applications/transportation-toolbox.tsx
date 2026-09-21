"use client";

import React from "react";
import Link from "next/link";
import {
  InventoryIcon,
  OrdersIcon,
  ShipmentsIcon,
  SchedulerIcon,
  AnalyticsIcon,
  DriverIcon,
  IntegrationsIcon,
} from "../icons";
import type { ApplicationItem } from "@/types/turvo";

const applications: Omit<ApplicationItem, "href">[] = [
  {
    id: "inventory",
    title: "Inventory",
    description:
      "Our data-driven inventory management system ensures you’re up-to-date on your entire fleet.",
    iconName: "inventory",
  },
  {
    id: "orders",
    title: "Orders",
    description:
      "Stay on top of all orders for improved customer service, repeat business, and greater returns.",
    iconName: "orders",
  },
  {
    id: "shipments",
    title: "Shipments",
    description:
      "Track your orders 24/7 with automated tools to reduce labor costs and improve service.",
    iconName: "shipments",
  },
  {
    id: "scheduler",
    title: "Scheduler",
    description:
      "Optimize appointment scheduling and stay on track with real-time movement and status info.",
    iconName: "scheduler",
  },
  {
    id: "analytics",
    title: "Analytics",
    description:
      "Analytics provide actionable insights to power your decisions on a day-to-day and macro basis.",
    iconName: "analytics",
  },
  {
    id: "driver",
    title: "Driver",
    description:
      "With telematics, Loadlinkers works with drivers to gain complete visibility while tracking delivery trends.",
    iconName: "driver",
  },
  {
    id: "integrations",
    title: "Integrations",
    description:
      "Unify your supply chain. Connecting people, processes, and systems to empower logistics teams to work together.",
    iconName: "integrations",
  },
];

export function TransportationToolbox() {
  const renderIcon = (name: ApplicationItem["iconName"]) => {
    const iconClass = "w-20 h-20 sm:w-24 sm:h-24 mx-auto";
    switch (name) {
      case "inventory":
        return <InventoryIcon className={iconClass} />;
      case "orders":
        return <OrdersIcon className={iconClass} />;
      case "shipments":
        return <ShipmentsIcon className={iconClass} />;
      case "scheduler":
        return <SchedulerIcon className={iconClass} />;
      case "analytics":
        return <AnalyticsIcon className={iconClass} />;
      case "driver":
        return <DriverIcon className={iconClass} />;
      case "integrations":
        return <IntegrationsIcon className={iconClass} />;
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-slate-50 relative border-b border-slate-200/80 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="text-center space-y-3 mb-14 sm:mb-20">
          <div className="inline-block">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full">
              Your Transportation Toolbox
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Loadlinkers TMS Applications
          </h2>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {applications.map((app) => (
            <div
              key={app.id}
              className="relative rounded-2xl p-6 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between text-center"
            >
              <div>
                <div className="mb-4">{renderIcon(app.iconName)}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{app.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {app.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Centered CTA */}
        <div className="mt-14 sm:mt-16 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
          >
            See Loadlinkers In Action
          </Link>
        </div>
      </div>
    </section>
  );
}
