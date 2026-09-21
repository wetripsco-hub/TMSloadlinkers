"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { LoadlinkersLogo } from "../icons";
import { TopBar } from "./top-bar";
import { SearchModal } from "./search-modal";
import { MobileNav } from "./mobile-nav";
import { StartTrialButton } from "@/components/pricing/start-trial-button";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
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
            ? "bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-3"
            : "bg-white/70 backdrop-blur-md border-b border-slate-200/60 py-4 sm:py-5"
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
              href="#features"
              className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              FAQ
            </Link>
          </nav>

          {/* Desktop Right CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <StartTrialButton className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider turvo-gradient-btn">
              Start Your Free 7-Day Trial
            </StartTrialButton>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-slate-600 hover:text-blue-600"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="p-2 text-slate-700 hover:text-blue-600"
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
