"use client";

import React from "react";
import Link from "next/link";
import { LoadlinkersLogo } from "../icons";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-sm">
      {/* Top Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Column 1: Logo & Mission Statement */}
          <div className="lg:col-span-5 space-y-4">
            <Link href="/" className="inline-block">
              <LoadlinkersLogo className="h-8 sm:h-9 md:h-10 w-auto max-w-[210px]" />
            </Link>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
              Loadlinkers revolutionizes the way things move by creating a standard way to share, communicate, and collaborate in real time.
            </p>
          </div>

          {/* Column 2: Product */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Product
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="#features" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-slate-600 hover:text-blue-600 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#faq" className="text-slate-600 hover:text-blue-600 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Get Started */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Get Started
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/signup" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Log In
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Legal
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/terms" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright */}
      <div className="border-t border-slate-200 py-8 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span>© Loadlinkers, LLC 2026 | All rights reserved</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <Link href="/terms" className="hover:text-blue-600 transition-colors">
              Terms of Service
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
