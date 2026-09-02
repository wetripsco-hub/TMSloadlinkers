"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  InventoryIcon,
  OrdersIcon,
  ShipmentsIcon,
  SchedulerIcon,
  AnalyticsIcon,
  DriverIcon,
  IntegrationsIcon,
} from "../icons";
import { ApplicationItem } from "@/types/turvo";

const applications: ApplicationItem[] = [
  {
    id: "inventory",
    title: "Inventory",
    description:
      "Our data-driven inventory management system ensures you’re up-to-date on your entire fleet.",
    href: "#inventory",
    iconName: "inventory",
  },
  {
    id: "orders",
    title: "Orders",
    description:
      "Stay on top of all orders for improved customer service, repeat business, and greater returns.",
    href: "#orders",
    iconName: "orders",
  },
  {
    id: "shipments",
    title: "Shipments",
    description:
      "Track your orders 24/7 with automated tools to reduce labor costs and improve service.",
    href: "#shipments",
    iconName: "shipments",
  },
  {
    id: "scheduler",
    title: "Scheduler",
    description:
      "Optimize appointment scheduling and stay on track with real-time movement and status info.",
    href: "#scheduling",
    iconName: "scheduler",
  },
  {
    id: "analytics",
    title: "Analytics",
    description:
      "Analytics provide actionable insights to power your decisions on a day-to-day and macro basis.",
    href: "#analytics",
    iconName: "analytics",
  },
  {
    id: "driver",
    title: "Driver",
    description:
      "With telematics, Loadlinkers works with drivers to gain complete visibility while tracking delivery trends.",
    href: "#driver",
    iconName: "driver",
  },
  {
    id: "integrations",
    title: "Integrations",
    description:
      "Unify your supply chain. Connecting people, processes, and systems to empower logistics teams to work together.",
    href: "#integrations",
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
    <section className="py-16 sm:py-24 bg-[#18171d] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="text-center space-y-2 mb-14 sm:mb-20">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#49c2f5]">
            Your Transportation Toolbox
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Loadlinkers TMS Applications
          </h2>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {applications.map((app) => (
            <Link
              key={app.id}
              href={app.href}
              className="group relative rounded-2xl p-6 bg-[#1f1e24] border border-white/10 hover:border-[#49c2f5]/40 shadow-xl turvo-card-hover flex flex-col justify-between text-center transition-all duration-300"
            >
              <div>
                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {renderIcon(app.iconName)}
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#49c2f5] transition-colors">
                  {app.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#a0a0aa] leading-relaxed">
                  {app.description}
                </p>
              </div>

              <div className="pt-6 flex justify-center">
                <div className="w-9 h-9 rounded-full bg-white/5 border border-white/15 flex items-center justify-center text-white/60 group-hover:text-[#18171d] group-hover:bg-[#49c2f5] group-hover:border-[#49c2f5] transition-all duration-300">
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom Centered CTA */}
        <div className="mt-14 sm:mt-16 text-center">
          <Link
            href="#schedule-demo"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider turvo-gradient-btn shadow-lg"
          >
            See Loadlinkers In Action
          </Link>
        </div>
      </div>
    </section>
  );
}
