"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function MegaMenuCompany() {
  return (
    <div className="w-[650px] p-6 bg-[#1f1e24] border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl grid grid-cols-2 gap-6 text-sm animate-in fade-in zoom-in-95 duration-150">
      {/* Links column */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#49c2f5] mb-3">
          About Loadlinkers
        </h4>
        <ul className="space-y-2.5">
          <li>
            <Link
              href="#leadership"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>Leadership</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
          <li>
            <Link
              href="#careers"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>Careers</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
          <li>
            <Link
              href="#our-culture"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>Our Culture</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
          <li>
            <Link
              href="#partners"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>Partners</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
        </ul>
      </div>

      {/* Featured News Card */}
      <div className="bg-[#18171d] border border-white/10 rounded-xl p-4 flex flex-col justify-between group hover:border-[#49c2f5]/40 transition-colors">
        <div>
          <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-3">
            <img
              src="/images/mega-menu/alpha-zero.jpg"
              alt="Alpha Zero Strategic Partnership"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#49c2f5]">
            Latest Announcement
          </span>
          <h5 className="text-sm font-semibold text-white mt-1 line-clamp-2">
            Alpha Zero Global Logistics Announces Strategic Partnership with Loadlinkers
          </h5>
          <p className="text-xs text-[#a0a0aa] mt-1.5 line-clamp-2">
            Powering next-generation managed transportation platform with collaborative TMS.
          </p>
        </div>
        <Link
          href="#news-partnership"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#49c2f5] hover:text-[#5dd0ff] mt-3 group-hover:translate-x-0.5 transition-all"
        >
          <span>Read Release</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
