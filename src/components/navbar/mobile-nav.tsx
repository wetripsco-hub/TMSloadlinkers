"use client";

import React from "react";
import Link from "next/link";
import { X, Search } from "lucide-react";
import { LoadlinkersLogo } from "../icons";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
}

export function MobileNav({ isOpen, onClose, onOpenSearch }: MobileNavProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white border-l border-slate-200 p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col justify-between text-slate-900">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-200">
            <Link href="/" onClick={onClose}>
              <LoadlinkersLogo className="h-7 sm:h-8 w-auto max-w-[170px]" />
            </Link>
            <button
              onClick={onClose}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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
            className="w-full mt-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-blue-400 transition-colors text-sm cursor-pointer"
          >
            <Search className="w-4 h-4 text-blue-600" />
            <span>Search articles, solutions...</span>
          </button>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1">
            <Link
              href="#features"
              onClick={onClose}
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-800 hover:text-blue-600 hover:bg-slate-50 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              onClick={onClose}
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-800 hover:text-blue-600 hover:bg-slate-50 transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              onClick={onClose}
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-800 hover:text-blue-600 hover:bg-slate-50 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              onClick={onClose}
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-800 hover:text-blue-600 hover:bg-slate-50 transition-colors"
            >
              FAQ
            </Link>
          </nav>
        </div>

        {/* Bottom actions */}
        <div className="pt-6 border-t border-slate-200 space-y-3">
          <Link
            href="/signup"
            onClick={onClose}
            className="w-full block py-3 text-center rounded-full font-bold text-sm turvo-gradient-btn"
          >
            Get Started
          </Link>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <Link href="/login" onClick={onClose} className="hover:text-blue-600 font-medium">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
