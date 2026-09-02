"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function MegaMenuProduct() {
  return (
    <div className="w-[850px] p-6 bg-[#1f1e24] border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl grid grid-cols-3 gap-6 text-sm animate-in fade-in zoom-in-95 duration-150">
      {/* Column 1: Loadlinkers & Overview */}
      <div className="space-y-6">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#49c2f5] mb-3">
            Loadlinkers Platform
          </h4>
          <ul className="space-y-2.5">
            <li>
              <Link
                href="#tms"
                className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
              >
                <span>TMS</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
              </Link>
            </li>
            <li>
              <Link
                href="#collaboration"
                className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
              >
                <span>Collaboration</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
              </Link>
            </li>
            <li>
              <Link
                href="#visibility"
                className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
              >
                <span>Visibility</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
              </Link>
            </li>
          </ul>
        </div>

        <div className="pt-2 border-t border-white/10">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#49c2f5] mb-3">
            Overview
          </h4>
          <ul className="space-y-2.5">
            <li>
              <Link
                href="#what-is-loadlinkers"
                className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
              >
                <span>What Is Loadlinkers?</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
              </Link>
            </li>
            <li>
              <Link
                href="#roi-calculator"
                className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
              >
                <span>ROI Calculator</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Column 2: Solutions For */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#49c2f5] mb-3">
          Solutions For
        </h4>
        <ul className="space-y-2.5">
          <li>
            <Link
              href="#3pls"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>3PLs</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
          <li>
            <Link
              href="#freight-brokers"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>Freight Brokers</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
          <li>
            <Link
              href="#shippers"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>Shippers</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
          <li>
            <Link
              href="#carriers"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>Carriers</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
        </ul>
      </div>

      {/* Column 3: Digital Applications */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#49c2f5] mb-3">
          Digital Applications
        </h4>
        <ul className="space-y-2.5">
          <li>
            <Link
              href="#orders"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>Order to Shipment Planning</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
          <li>
            <Link
              href="#shipments"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>Shipment Execution</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
          <li>
            <Link
              href="#inventory"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>Inventory & Visibility</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
          <li>
            <Link
              href="#scheduling"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>Appointment Scheduling</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
          <li>
            <Link
              href="#analytics"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>Analytics</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
          <li>
            <Link
              href="#driver-app"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>Driver App</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
          <li>
            <Link
              href="#integrations"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>Integration Hub</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
