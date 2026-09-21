"use client";

import React, { useEffect, useRef } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PLANS } from "@/lib/stripe/plans";

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
    { title: "Features", href: "#features" },
    { title: "How It Works", href: "#how-it-works" },
    { title: "Pricing", href: "#pricing" },
    { title: "FAQ", href: "#faq" },
    { title: `${PLANS.starter.name} plan`, href: "#pricing" },
    { title: `${PLANS.growth.name} plan`, href: "#pricing" },
    { title: `${PLANS.enterprise.name} plan`, href: "#pricing" },
    { title: "Sign up", href: "/signup" },
    { title: "Log in", href: "/login" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close search"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6">
          <Search className="w-6 h-6 text-blue-600" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search Loadlinkers..."
            className="w-full bg-transparent text-xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Popular Searches
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {popularSearches.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-100 transition-all group"
              >
                <span>{item.title}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
