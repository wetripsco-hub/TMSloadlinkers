"use client";

import React from "react";
import Link from "next/link";
import { Search } from "lucide-react";

interface TopBarProps {
  onOpenSearch: () => void;
}

export function TopBar({ onOpenSearch }: TopBarProps) {
  return (
    <div className="bg-[#111015] border-b border-white/10 text-xs text-[#a0a0aa] py-2 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span>Do you have unnecessary costs and risks using a legacy TMS? 🧐</span>
          <Link
            href="#white-papers"
            className="text-[#49c2f5] hover:text-[#5dd0ff] font-medium underline underline-offset-2 transition-colors"
          >
            Learn More Here.
          </Link>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 text-white/80 hover:text-[#49c2f5] transition-colors cursor-pointer"
            aria-label="Open Search"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
          <span className="text-white/20">|</span>
          <Link
            href="#login"
            className="text-white/80 hover:text-[#49c2f5] transition-colors"
          >
            Login
          </Link>
          <span className="text-white/20">|</span>
          <Link
            href="#contact"
            className="text-white/80 hover:text-[#49c2f5] transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
