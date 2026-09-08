"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft, Sparkles, CheckCircle2 } from "lucide-react";

export const TOUR_STORAGE_KEY = "loadlinkers_tms_tour_completed";

export interface TourStep {
  id: string;
  title: string;
  content: string;
  targetSelector?: string;
  placement?: "center" | "right" | "bottom";
  tag?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to FreightLink TMS",
    content:
      "Your command center for freight operations. Monitor live revenues, profit margins, and shipment volume in real-time.",
    targetSelector: "#overview-header",
    placement: "center",
    tag: "Command Center",
  },
  {
    id: "loads",
    title: "Dispatching & Loads",
    content:
      "Create shipments, assign carriers, generate rate confirmations, and manage freight lifecycles.",
    targetSelector: '[data-tour="nav-loads"]',
    placement: "right",
    tag: "Core Operations",
  },
  {
    id: "carriers",
    title: "Carrier Network & Safety",
    content:
      "Verify carrier MC/DOT credentials, inspect insurance certificates, and maintain trusted partner directories.",
    targetSelector: '[data-tour="nav-carriers"]',
    placement: "right",
    tag: "Safety & Compliance",
  },
  {
    id: "tracking",
    title: "Live Driver Tracking",
    content:
      "Send frictionless SMS tracking links to drivers and track breadcrumb coordinates on the live interactive map.",
    targetSelector: '[data-tour="nav-tracking"]',
    placement: "right",
    tag: "Real-Time Telematics",
  },
  {
    id: "invoices",
    title: "Billing & Settlements",
    content:
      "One-click invoice generation with your company's custom legal branding and automated payment remittance instructions.",
    targetSelector: '[data-tour="nav-invoices"]',
    placement: "right",
    tag: "Financial Automation",
  },
];

/**
 * Trigger product tour programmatically from anywhere (e.g. settings or support page).
 */
export function triggerProductTour() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOUR_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("loadlinkers:start-tour"));
}

export function ProductTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TOUR_STEPS[currentStep] || TOUR_STEPS[0];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  const updateTargetRect = useCallback(() => {
    if (!step.targetSelector || step.placement === "center") {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [step]);

  const handleDismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
    }
    setIsOpen(false);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  }, [currentStep, handleDismiss]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Initial check and mount delay
  useEffect(() => {
    const hasCompleted = window.localStorage.getItem(TOUR_STORAGE_KEY);
    const searchParams = new URLSearchParams(window.location.search);
    const explicitTour = searchParams.get("tour") === "true";

    if (explicitTour) {
      // Clean up search param without page reload
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }

    if (!hasCompleted || explicitTour) {
      // 600ms mount delay to ensure DOM and layout hydration
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setIsOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  // Event listener for manual re-triggering
  useEffect(() => {
    const onStartTour = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };

    window.addEventListener("loadlinkers:start-tour", onStartTour);
    return () => {
      window.removeEventListener("loadlinkers:start-tour", onStartTour);
    };
  }, []);

  // Calculate target element bounding rectangle on step change, resize, and scroll
  useEffect(() => {
    if (!isOpen) return;

    const rafId = requestAnimationFrame(() => {
      updateTargetRect();
    });

    const handleResize = () => updateTargetRect();
    const handleScroll = () => updateTargetRect();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, currentStep, updateTargetRect]);

  // Keyboard navigation: Escape to dismiss, Arrows to navigate
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleDismiss, handleNext, handlePrev]);

  if (typeof document === "undefined" || !isOpen) {
    return null;
  }

  const isCentered =
    step.placement === "center" ||
    !targetRect ||
    (typeof window !== "undefined" && window.innerWidth < 768);

  // Compute position for floating popover card when aligned next to target element
  let popoverStyle: React.CSSProperties = {};
  if (!isCentered && targetRect) {
    const popoverWidth = 380;
    const popoverHeight = 280;
    const padding = 16;

    // Place to the right of the sidebar item
    let left = targetRect.right + padding;
    if (left + popoverWidth > window.innerWidth - padding) {
      left = Math.max(padding, window.innerWidth - popoverWidth - padding);
    }

    let top = targetRect.top - 12;
    if (top + popoverHeight > window.innerHeight - padding) {
      top = Math.max(padding, window.innerHeight - popoverHeight - padding);
    }
    if (top < padding) {
      top = padding;
    }

    popoverStyle = {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 9999,
    };
  } else {
    popoverStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 9999,
    };
  }

  const tourContent = (
    <div className="fixed inset-0 select-none pointer-events-none">
      {/* 1. Backdrop Overlay: z-[9990] */}
      {isCentered ? (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] z-[9990] pointer-events-auto transition-opacity duration-200" />
      ) : (
        <svg
          className="fixed inset-0 w-full h-full z-[9990] pointer-events-auto transition-opacity duration-200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <mask id="tour-spotlight-mask">
              {/* White reveals the dark backdrop */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* Black cuts out the spotlight hole for the target element */}
              {targetRect && (
                <rect
                  x={targetRect.left - 4}
                  y={targetRect.top - 4}
                  width={targetRect.width + 8}
                  height={targetRect.height + 8}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(2, 6, 23, 0.6)"
            mask="url(#tour-spotlight-mask)"
          />
        </svg>
      )}

      {/* 2. Spotlight Cutout (Bounding Ring): z-[9992] */}
      {!isCentered && targetRect && (
        <div
          className="fixed z-[9992] pointer-events-none transition-all duration-300 rounded-xl ring-4 ring-blue-500/80 ring-offset-2 ring-offset-slate-900"
          style={{
            top: `${targetRect.top - 4}px`,
            left: `${targetRect.left - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
          }}
        />
      )}

      {/* 3. Click Interceptor: z-[9993] over the highlighted element to prevent route navigation */}
      {!isCentered && targetRect && (
        <div
          className="fixed z-[9993] pointer-events-auto cursor-pointer rounded-xl"
          style={{
            top: `${targetRect.top - 4}px`,
            left: `${targetRect.left - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleNext();
          }}
          title="Click to advance tour"
        />
      )}

      {/* 4. Tour Popover Modal Card: z-[9999] */}
      <div
        className="pointer-events-auto relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl opacity-100 z-[9999] transition-all duration-200 ease-out animate-in fade-in zoom-in-95"
        style={popoverStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-step-title"
      >
        {/* Directional caret pointing to sidebar item on desktop */}
        {!isCentered && (
          <div
            className="hidden md:block absolute -left-2 top-6 h-4 w-4 rotate-45 border-b border-l border-slate-200 bg-white"
            style={{ backgroundColor: "#ffffff" }}
          />
        )}

        {/* Progress Segment Indicator */}
        <div className="mb-4 flex items-center gap-1.5">
          {TOUR_STEPS.map((s, idx) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                idx <= currentStep ? "bg-blue-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Header Row: Step counter pill, Tag, & Close button */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </span>
            {step.tag && (
              <span className="text-[11px] font-medium text-slate-400">
                {step.tag}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Close product tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="my-3 space-y-1.5">
          <div className="flex items-center gap-2">
            {currentStep === 0 ? (
              <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
            ) : isLastStep ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : null}
            <h3
              id="tour-step-title"
              className="text-base font-bold tracking-tight text-slate-900"
            >
              {step.title}
            </h3>
          </div>
          <p className="text-xs text-slate-600 font-normal leading-relaxed">
            {step.content}
          </p>
        </div>

        {/* Footer Controls */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Skip for now
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {isLastStep ? "Finish Tour" : "Next"}
              {!isLastStep && <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(tourContent, document.body);
}
