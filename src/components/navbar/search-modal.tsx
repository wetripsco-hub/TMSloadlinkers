"use client";

import React, { useEffect, useRef } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const popularSearches = [
    { title: "TMS Overview", href: "#tms" },
    { title: "3PL Solutions", href: "#3pls" },
    { title: "Freight Brokers", href: "#freight-brokers" },
    { title: "ROI Calculator", href: "#roi-calculator" },
    { title: "Driver App", href: "#driver-app" },
    { title: "Integration Hub", href: "#integrations" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#18171d] border border-white/15 rounded-2xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close search"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-white/15 pb-4 mb-6">
          <Search className="w-6 h-6 text-[#49c2f5]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search Loadlinkers..."
            className="w-full bg-transparent text-xl font-medium text-white placeholder:text-white/40 focus:outline-none"
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
            Popular Searches
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {popularSearches.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/90 hover:text-[#49c2f5] transition-all group"
              >
                <span>{item.title}</span>
                <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-[#49c2f5] group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
