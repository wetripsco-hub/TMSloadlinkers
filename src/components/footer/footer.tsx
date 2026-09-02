"use client";

import React from "react";
import Link from "next/link";
import {
  LoadlinkersLogo,
  LinkedInIcon,
  FacebookIcon,
  XTwitterIcon,
  YouTubeIcon,
} from "../icons";

export function Footer() {
  return (
    <footer className="bg-[#111015] border-t border-white/10 text-[#a0a0aa] text-sm">
      {/* Top 4-Column Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Column 1: Logo & Mission Statement */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-block">
              <LoadlinkersLogo className="h-8 sm:h-9 md:h-10 w-auto max-w-[210px]" />
            </Link>
            <p className="text-xs sm:text-sm text-[#a0a0aa] leading-relaxed max-w-sm">
              Loadlinkers revolutionizes the way things move by creating a standard way to share, communicate, and collaborate in real time.
            </p>
          </div>

          {/* Column 2: Discover Loadlinkers */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Discover Loadlinkers
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="#why-loadlinkers" className="hover:text-[#49c2f5] transition-colors">
                  Why Loadlinkers
                </Link>
              </li>
              <li>
                <Link href="#what-is-loadlinkers" className="hover:text-[#49c2f5] transition-colors">
                  What Is Loadlinkers?
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Solutions For */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Solutions For
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="#freight-brokers" className="hover:text-[#49c2f5] transition-colors">
                  Freight Brokers
                </Link>
              </li>
              <li>
                <Link href="#shippers" className="hover:text-[#49c2f5] transition-colors">
                  Shippers
                </Link>
              </li>
              <li>
                <Link href="#3pls" className="hover:text-[#49c2f5] transition-colors">
                  3PLs
                </Link>
              </li>
              <li>
                <Link href="#carriers" className="hover:text-[#49c2f5] transition-colors">
                  Carriers
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Helpful Links */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Helpful Links
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="#news" className="hover:text-[#49c2f5] transition-colors">
                  News
                </Link>
              </li>
              <li>
                <Link href="#articles" className="hover:text-[#49c2f5] transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#careers" className="hover:text-[#49c2f5] transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#contact" className="hover:text-[#49c2f5] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#help-center" className="hover:text-[#49c2f5] transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Socials */}
      <div className="border-t border-white/5 py-8 bg-[#0c0b0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#a0a0aa] text-center sm:text-left">
            <span>© Loadlinkers, LLC 2026 | All rights reserved | </span>
            <Link href="#terms" className="hover:text-white underline underline-offset-2 transition-colors">
              Terms &amp; Policies
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            <Link
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-[#49c2f5] hover:scale-110 transition-all"
            >
              <LinkedInIcon className="w-6 h-6" />
            </Link>
            <Link
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-[#49c2f5] hover:scale-110 transition-all"
            >
              <FacebookIcon className="w-6 h-6" />
            </Link>
            <Link
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-[#49c2f5] hover:scale-110 transition-all"
            >
              <XTwitterIcon className="w-6 h-6" />
            </Link>
            <Link
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-[#49c2f5] hover:scale-110 transition-all"
            >
              <YouTubeIcon className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
