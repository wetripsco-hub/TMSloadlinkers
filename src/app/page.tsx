"use client";

import React from "react";
import { Navbar } from "@/components/navbar/navbar";
import { HeroSection } from "@/components/hero/hero-section";
import { HowItWorksSection } from "@/components/how-it-works/how-it-works-section";
import { FeaturesSection } from "@/components/features/features-section";
import { WhoLoadlinkersPowers } from "@/components/solutions/who-loadlinkers-powers";
import { CollaborationCloud } from "@/components/collaboration-cloud/feature-rows";
import { LogoMarquee } from "@/components/marquee/logo-marquee";
import { TransportationToolbox } from "@/components/applications/transportation-toolbox";
import { CustomerVideoSpotlight } from "@/components/video-spotlight/customer-video-modal";
import { NextStepCTA } from "@/components/cta/next-step-cta";
import { SubscribeSection } from "@/components/newsletter/subscribe-section";
import { LatestArticles } from "@/components/resources/latest-articles";
import { FaqSection } from "@/components/faq/faq-section";
import { PricingSection } from "@/components/pricing/pricing-section";
import { Footer } from "@/components/footer/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <WhoLoadlinkersPowers />
        <CollaborationCloud />
        <LogoMarquee />
        <TransportationToolbox />
        <CustomerVideoSpotlight />
        <NextStepCTA />
        <SubscribeSection />
        <LatestArticles />
        <FaqSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
