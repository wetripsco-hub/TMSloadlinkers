"use client";

import React from "react";
import type { ArticleItem } from "@/types/turvo";

const articles: Omit<ArticleItem, "href" | "categoryHref">[] = [
  {
    id: "art-1",
    category: "Articles",
    title: 'What Makes a TMS "Collaborative"? (And Why Isolated Tracking Is Costing You)',
    excerpt:
      "Discover what makes a TMS truly collaborative. Learn how connecting shippers, carriers, and brokers with real-time data eliminates supply chain silos.",
    imageSrc: "/images/resources/article-1.png",
    imageAlt: "What Makes a TMS Collaborative",
  },
  {
    id: "art-2",
    category: "Articles",
    title: "3 Clicks vs. 100: How Modern TMS UX Changes Broker Productivity",
    excerpt:
      "100 clicks vs. 3: see how Loadlinkers's modern TMS UX cuts manual work, speeds up onboarding, and boosts broker productivity across your brokerage.",
    imageSrc: "/images/resources/article-2.png",
    imageAlt: "Modern TMS UX for Broker Productivity",
  },
  {
    id: "art-3",
    category: "Articles",
    title: "How to Choose a TMS That Your Freight Brokers Will Actually Want to Use",
    excerpt:
      "Discover why clunky TMS software hurts broker productivity. Learn how a modern, consumer-grade UI/UX speeds up onboarding, reduces churn, and drives real ROI.",
    imageSrc: "/images/resources/article-3.jpg",
    imageAlt: "How to Choose a TMS for Freight Brokers",
  },
];

export function LatestArticles() {
  return (
    <section className="py-16 sm:py-24 bg-slate-50 border-t border-slate-200/80 relative text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="text-center space-y-3 mb-14 sm:mb-20">
          <span className="inline-block text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full">
            Loadlinkers Resource Center
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            The Latest from Loadlinkers
          </h2>
        </div>

        {/* 3-Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((art) => (
            <article
              key={art.id}
              className="group rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <img
                    src={art.imageSrc}
                    alt={art.imageAlt}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-6 space-y-3">
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-600">
                    {art.category}
                  </span>

                  <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-2">
                    {art.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {art.excerpt}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
