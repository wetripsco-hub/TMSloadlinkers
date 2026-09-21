"use client";

import React from "react";
import Link from "next/link";
import { Search } from "lucide-react";

interface TopBarProps {
  onOpenSearch: () => void;
}

export function TopBar({ onOpenSearch }: TopBarProps) {
  return (
    <div className="bg-slate-100 border-b border-slate-200 text-xs text-slate-600 py-2 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span>Do you have unnecessary costs and risks using a legacy TMS? 🧐</span>
          <Link
            href="#pricing"
            className="text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2 transition-colors"
          >
            See Pricing.
          </Link>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            aria-label="Open Search"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
          <span className="text-slate-300">|</span>
          <Link
            href="/login"
            className="text-slate-700 hover:text-blue-600 transition-colors font-medium"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
