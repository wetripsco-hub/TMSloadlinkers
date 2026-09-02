"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ArticleItem } from "@/types/turvo";

const articles: ArticleItem[] = [
  {
    id: "art-1",
    category: "Articles",
    categoryHref: "#articles",
    title: 'What Makes a TMS "Collaborative"? (And Why Isolated Tracking Is Costing You)',
    excerpt:
      "Discover what makes a TMS truly collaborative. Learn how connecting shippers, carriers, and brokers with real-time data eliminates supply chain silos.",
    href: "#articles-collaborative-tms",
    imageSrc: "/images/resources/article-1.png",
    imageAlt: "What Makes a TMS Collaborative",
  },
  {
    id: "art-2",
    category: "Articles",
    categoryHref: "#articles",
    title: "3 Clicks vs. 100: How Modern TMS UX Changes Broker Productivity",
    excerpt:
      "100 clicks vs. 3: see how Loadlinkers's modern TMS UX cuts manual work, speeds up onboarding, and boosts broker productivity across your brokerage.",
    href: "#articles-modern-tms-ux",
    imageSrc: "/images/resources/article-2.png",
    imageAlt: "Modern TMS UX for Broker Productivity",
  },
  {
    id: "art-3",
    category: "Articles",
    categoryHref: "#articles",
    title: "How to Choose a TMS That Your Freight Brokers Will Actually Want to Use",
    excerpt:
      "Discover why clunky TMS software hurts broker productivity. Learn how a modern, consumer-grade UI/UX speeds up onboarding, reduces churn, and drives real ROI.",
    href: "#articles-choose-a-tms",
    imageSrc: "/images/resources/article-3.jpg",
    imageAlt: "How to Choose a TMS for Freight Brokers",
  },
];

export function LatestArticles() {
  return (
    <section className="py-16 sm:py-24 bg-[#18171d] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="text-center space-y-2 mb-14 sm:mb-20">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#49c2f5]">
            Loadlinkers Resource Center
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            The Latest from Loadlinkers
          </h2>
        </div>

        {/* 3-Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((art) => (
            <article
              key={art.id}
              className="group rounded-2xl bg-[#1f1e24] border border-white/10 overflow-hidden shadow-xl turvo-card-hover flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail with Zoom */}
                <Link href={art.href} className="block relative aspect-[16/9] overflow-hidden bg-[#111015]">
                  <img
                    src={art.imageSrc}
                    alt={art.imageAlt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>

                <div className="p-6 space-y-3">
                  <Link
                    href={art.categoryHref}
                    className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#49c2f5] hover:text-[#5dd0ff]"
                  >
                    {art.category}
                  </Link>

                  <h3 className="text-lg font-bold text-white leading-snug group-hover:text-[#49c2f5] transition-colors line-clamp-2">
                    <Link href={art.href}>{art.title}</Link>
                  </h3>

                  <p className="text-xs sm:text-sm text-[#a0a0aa] leading-relaxed line-clamp-3">
                    {art.excerpt}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2">
                <Link
                  href={art.href}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#49c2f5] group-hover:text-white group-hover:translate-x-1 transition-all"
                >
                  <span>Read More</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom Centered CTA */}
        <div className="mt-14 sm:mt-16 text-center">
          <Link
            href="#resources"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 border border-white/20 text-white hover:bg-[#49c2f5] hover:text-[#18171d] hover:border-[#49c2f5] transition-all"
          >
            See More
          </Link>
        </div>
      </div>
    </section>
  );
}
