"use client";

import React from "react";
import { Navbar } from "@/components/navbar/navbar";
import { HeroSection } from "@/components/hero/hero-section";
import { WhoLoadlinkersPowers } from "@/components/solutions/who-loadlinkers-powers";
import { CollaborationCloud } from "@/components/collaboration-cloud/feature-rows";
import { LogoMarquee } from "@/components/marquee/logo-marquee";
import { TransportationToolbox } from "@/components/applications/transportation-toolbox";
import { CustomerVideoSpotlight } from "@/components/video-spotlight/customer-video-modal";
import { NextStepCTA } from "@/components/cta/next-step-cta";
import { SubscribeSection } from "@/components/newsletter/subscribe-section";
import { LatestArticles } from "@/components/resources/latest-articles";
import { Footer } from "@/components/footer/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#18171d] text-white">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <WhoLoadlinkersPowers />
        <CollaborationCloud />
        <LogoMarquee />
        <TransportationToolbox />
        <CustomerVideoSpotlight />
        <NextStepCTA />
        <SubscribeSection />
        <LatestArticles />
      </main>
      <Footer />
    </div>
  );
}
