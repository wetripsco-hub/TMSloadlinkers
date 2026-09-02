"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function MegaMenuResources() {
  return (
    <div className="w-[700px] p-6 bg-[#1f1e24] border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl grid grid-cols-2 gap-6 text-sm animate-in fade-in zoom-in-95 duration-150">
      {/* Links column */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#49c2f5] mb-3">
          Knowledge Base
        </h4>
        <ul className="space-y-2.5">
          <li>
            <Link
              href="#customer-stories"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>Customer Stories</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
          <li>
            <Link
              href="#articles"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>Blog & Articles</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
          <li>
            <Link
              href="#news"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>News</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
          <li>
            <Link
              href="#white-papers"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>White Papers</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
          <li>
            <Link
              href="#videos"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>Videos</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
          <li>
            <Link
              href="#solution-briefs"
              className="group flex items-center justify-between text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>Solution Briefs</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-[#49c2f5] transition-all" />
            </Link>
          </li>
        </ul>
      </div>

      {/* Featured Card */}
      <div className="bg-[#18171d] border border-white/10 rounded-xl p-4 flex flex-col justify-between group hover:border-[#49c2f5]/40 transition-colors">
        <div>
          <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-3">
            <img
              src="/images/resources/article-1.png"
              alt="Loadlinkers Featured"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#49c2f5]">
            Featured Story
          </span>
          <h5 className="text-sm font-semibold text-white mt-1 line-clamp-2">
            What Makes a TMS &ldquo;Collaborative&rdquo;? (And Why Isolated Tracking Is Costing You)
          </h5>
          <p className="text-xs text-[#a0a0aa] mt-1.5 line-clamp-2">
            Learn how connecting shippers, carriers, and brokers with real-time data eliminates supply chain silos.
          </p>
        </div>
        <Link
          href="#featured-article"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#49c2f5] hover:text-[#5dd0ff] mt-3 group-hover:translate-x-0.5 transition-all"
        >
          <span>Read Article</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
