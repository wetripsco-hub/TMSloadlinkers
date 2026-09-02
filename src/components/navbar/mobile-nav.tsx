"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, ChevronDown, Search } from "lucide-react";
import { LoadlinkersLogo } from "../icons";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
}

export function MobileNav({ isOpen, onClose, onOpenSearch }: MobileNavProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    product: false,
    resources: false,
    company: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-[#18171d] border-l border-white/15 p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <Link href="/" onClick={onClose}>
              <LoadlinkersLogo className="h-7 sm:h-8 w-auto max-w-[170px]" />
            </Link>
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close Menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Search */}
          <button
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
            className="w-full mt-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-[#49c2f5]/40 transition-colors text-sm"
          >
            <Search className="w-4 h-4 text-[#49c2f5]" />
            <span>Search articles, solutions...</span>
          </button>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1">
            <Link
              href="#why-loadlinkers"
              onClick={onClose}
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-white/90 hover:text-[#49c2f5] hover:bg-white/5 transition-colors"
            >
              Discover Loadlinkers
            </Link>

            {/* Product Section */}
            <div>
              <button
                onClick={() => toggleSection("product")}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium text-white/90 hover:text-[#49c2f5] hover:bg-white/5 transition-colors"
              >
                <span>Product</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    openSections.product ? "rotate-180 text-[#49c2f5]" : "text-white/40"
                  }`}
                />
              </button>
              {openSections.product && (
                <div className="pl-4 pr-2 py-2 space-y-2 text-sm text-[#a0a0aa] border-l border-white/10 ml-3">
                  <Link href="#tms" onClick={onClose} className="block py-1 hover:text-white">
                    TMS Platform
                  </Link>
                  <Link href="#collaboration" onClick={onClose} className="block py-1 hover:text-white">
                    Collaboration
                  </Link>
                  <Link href="#visibility" onClick={onClose} className="block py-1 hover:text-white">
                    Visibility
                  </Link>
                  <Link href="#what-is-loadlinkers" onClick={onClose} className="block py-1 hover:text-white">
                    What Is Loadlinkers?
                  </Link>
                  <Link href="#roi-calculator" onClick={onClose} className="block py-1 hover:text-white">
                    ROI Calculator
                  </Link>
                  <Link href="#3pls" onClick={onClose} className="block py-1 hover:text-white">
                    3PLs Solution
                  </Link>
                  <Link href="#freight-brokers" onClick={onClose} className="block py-1 hover:text-white">
                    Freight Brokers
                  </Link>
                  <Link href="#shippers" onClick={onClose} className="block py-1 hover:text-white">
                    Shippers
                  </Link>
                  <Link href="#carriers" onClick={onClose} className="block py-1 hover:text-white">
                    Carriers
                  </Link>
                  <Link href="#orders" onClick={onClose} className="block py-1 hover:text-white">
                    Order Planning
                  </Link>
                  <Link href="#shipments" onClick={onClose} className="block py-1 hover:text-white">
                    Shipment Execution
                  </Link>
                  <Link href="#driver-app" onClick={onClose} className="block py-1 hover:text-white">
                    Driver App
                  </Link>
                  <Link href="#integrations" onClick={onClose} className="block py-1 hover:text-white">
                    Integrations
                  </Link>
                </div>
              )}
            </div>

            {/* Resources Section */}
            <div>
              <button
                onClick={() => toggleSection("resources")}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium text-white/90 hover:text-[#49c2f5] hover:bg-white/5 transition-colors"
              >
                <span>Resources</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    openSections.resources ? "rotate-180 text-[#49c2f5]" : "text-white/40"
                  }`}
                />
              </button>
              {openSections.resources && (
                <div className="pl-4 pr-2 py-2 space-y-2 text-sm text-[#a0a0aa] border-l border-white/10 ml-3">
                  <Link href="#customer-stories" onClick={onClose} className="block py-1 hover:text-white">
                    Customer Stories
                  </Link>
                  <Link href="#articles" onClick={onClose} className="block py-1 hover:text-white">
                    Blog
                  </Link>
                  <Link href="#news" onClick={onClose} className="block py-1 hover:text-white">
                    News
                  </Link>
                  <Link href="#white-papers" onClick={onClose} className="block py-1 hover:text-white">
                    White Papers
                  </Link>
                  <Link href="#videos" onClick={onClose} className="block py-1 hover:text-white">
                    Videos
                  </Link>
                  <Link href="#solution-briefs" onClick={onClose} className="block py-1 hover:text-white">
                    Solution Briefs
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="#pricing"
              onClick={onClose}
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-white/90 hover:text-[#49c2f5] hover:bg-white/5 transition-colors"
            >
              Pricing
            </Link>

            {/* Our Company Section */}
            <div>
              <button
                onClick={() => toggleSection("company")}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium text-white/90 hover:text-[#49c2f5] hover:bg-white/5 transition-colors"
              >
                <span>Our Company</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    openSections.company ? "rotate-180 text-[#49c2f5]" : "text-white/40"
                  }`}
                />
              </button>
              {openSections.company && (
                <div className="pl-4 pr-2 py-2 space-y-2 text-sm text-[#a0a0aa] border-l border-white/10 ml-3">
                  <Link href="#leadership" onClick={onClose} className="block py-1 hover:text-white">
                    Leadership
                  </Link>
                  <Link href="#careers" onClick={onClose} className="block py-1 hover:text-white">
                    Careers
                  </Link>
                  <Link href="#our-culture" onClick={onClose} className="block py-1 hover:text-white">
                    Our Culture
                  </Link>
                  <Link href="#partners" onClick={onClose} className="block py-1 hover:text-white">
                    Partners
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom actions */}
        <div className="pt-6 border-t border-white/10 space-y-3">
          <Link
            href="#schedule-demo"
            onClick={onClose}
            className="w-full block py-3 text-center rounded-full font-bold text-sm turvo-gradient-btn"
          >
            Schedule A Demo
          </Link>
          <div className="flex items-center justify-center gap-4 text-xs text-[#a0a0aa]">
            <Link href="#login" className="hover:text-white">
              Login
            </Link>
            <span>•</span>
            <Link href="#contact" onClick={onClose} className="hover:text-white">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
