"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Menu, Search } from "lucide-react";
import { LoadlinkersLogo } from "../icons";
import { TopBar } from "./top-bar";
import { MegaMenuProduct } from "./mega-menu-product";
import { MegaMenuResources } from "./mega-menu-resources";
import { MegaMenuCompany } from "./mega-menu-company";
import { SearchModal } from "./search-modal";
import { MobileNav } from "./mobile-nav";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <TopBar onOpenSearch={() => setIsSearchOpen(true)} />

      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? "bg-[#18171d]/95 backdrop-blur-md border-b border-white/10 shadow-lg py-3"
            : "bg-transparent py-4 sm:py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <LoadlinkersLogo className="h-8 sm:h-9 md:h-10 w-auto max-w-[200px]" />
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="#why-loadlinkers"
              className="px-3.5 py-2 text-sm font-medium text-white/90 hover:text-[#49c2f5] transition-colors"
            >
              Discover Loadlinkers
            </Link>

            {/* Product Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu("product")}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button
                className={`flex items-center gap-1 px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  activeMenu === "product" ? "text-[#49c2f5]" : "text-white/90 hover:text-[#49c2f5]"
                }`}
              >
                <span>Product</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    activeMenu === "product" ? "rotate-180 text-[#49c2f5]" : "text-white/50"
                  }`}
                />
              </button>
              {activeMenu === "product" && (
                <div className="absolute top-full -left-20 pt-2">
                  <MegaMenuProduct />
                </div>
              )}
            </div>

            {/* Resources Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu("resources")}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button
                className={`flex items-center gap-1 px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  activeMenu === "resources" ? "text-[#49c2f5]" : "text-white/90 hover:text-[#49c2f5]"
                }`}
              >
                <span>Resources</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    activeMenu === "resources" ? "rotate-180 text-[#49c2f5]" : "text-white/50"
                  }`}
                />
              </button>
              {activeMenu === "resources" && (
                <div className="absolute top-full -left-32 pt-2">
                  <MegaMenuResources />
                </div>
              )}
            </div>

            <Link
              href="#pricing"
              className="px-3.5 py-2 text-sm font-medium text-white/90 hover:text-[#49c2f5] transition-colors"
            >
              Pricing
            </Link>

            {/* Our Company Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu("company")}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button
                className={`flex items-center gap-1 px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  activeMenu === "company" ? "text-[#49c2f5]" : "text-white/90 hover:text-[#49c2f5]"
                }`}
              >
                <span>Our Company</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    activeMenu === "company" ? "rotate-180 text-[#49c2f5]" : "text-white/50"
                  }`}
                />
              </button>
              {activeMenu === "company" && (
                <div className="absolute top-full -left-32 pt-2">
                  <MegaMenuCompany />
                </div>
              )}
            </div>
          </nav>

          {/* Desktop Right CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-white/70 hover:text-[#49c2f5] transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <Link
              href="#schedule-demo"
              className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider turvo-gradient-btn"
            >
              Schedule A Demo
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-white/80 hover:text-[#49c2f5]"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="p-2 text-white/80 hover:text-[#49c2f5]"
              aria-label="Open Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Modals & Drawers */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />
    </>
  );
}
