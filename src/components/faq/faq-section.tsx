"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What's the difference between Broker and Dispatcher mode?",
    answer:
      "At signup you choose Freight Brokerage, Truck Dispatch, or Hybrid. This changes which financial fields you see — brokers see margin and shipper rate, dispatchers see carrier pay and driver settlements — without changing how loads, tracking, or documents work.",
  },
  {
    question: "Do I need a contract, or can I cancel anytime?",
    answer:
      "No contract. Starter and Growth are billed monthly or annually, and you can cancel anytime from Settings → Billing — no phone call or sales approval required.",
  },
  {
    question: "How does the free trial work?",
    answer:
      "Start Free Trial gives you 7 days on Starter or Growth with no credit card required. If the trial ends and you haven't added a card, your subscription is automatically canceled rather than charged — add a card any time during or after the trial to keep going.",
  },
  {
    question: "What happens to my data if I switch plans?",
    answer:
      "Nothing changes about your data. Your loads, carriers, customers, and documents belong to your organization, not your plan tier — switching plans changes your seat count and OCR limit, not what you've already built.",
  },
  {
    question: "Is my carrier and rate data secure?",
    answer:
      "Yes. Every table is protected by Postgres row-level security scoped to your organization, enforced at the database layer — not just in the app — so another tenant's rates, margins, or carrier data are never reachable, even through the API.",
  },
  {
    question: "Can I import my existing loads?",
    answer:
      "You can create a load instantly by uploading a signed Rate Confirmation — OCR reads the carrier, rate, and stop details and builds the load for you. A bulk CSV import isn't available yet.",
  },
  {
    question: "What counts toward my OCR document limit?",
    answer:
      "Every document you upload for OCR processing — Rate Confirmations and proofs of delivery — counts toward your plan's monthly limit (50 on Starter, 250 on Growth, unlimited with fair use on Enterprise).",
  },
  {
    question: "Do I need a dispatcher seat for every employee?",
    answer:
      "Only for people who need to log in and work loads. Starter includes 2 seats, Growth includes 5, and Enterprise starts at 50+ — your customer- and carrier-facing tracking links don't require a login or count against your seats.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 sm:py-24 bg-white border-b border-slate-200/80 text-slate-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="text-center space-y-3 mb-12 sm:mb-16">
          <div className="inline-block">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full">
              FAQ
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Questions Before You Buy
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-blue-600 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-4 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
