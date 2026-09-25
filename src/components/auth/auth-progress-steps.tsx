"use client";

import { Loader2 } from "lucide-react";

export interface AuthProgressStepsProps {
  steps: readonly string[];
  currentStep: number;
}

export function AuthProgressSteps({ steps, currentStep }: AuthProgressStepsProps) {
  const label = steps[Math.min(currentStep, steps.length - 1)];

  return (
    <span className="flex w-full flex-col items-center gap-2">
      <span className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white" />
        <span key={label} className="animate-[fade-in_0.25s_ease-out]">
          {label}
        </span>
      </span>
      <span className="flex w-full items-center gap-1.5" aria-hidden="true">
        {steps.map((step, index) => (
          <span
            key={step}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              index <= currentStep ? "bg-white" : "bg-white/25"
            }`}
          />
        ))}
      </span>
    </span>
  );
}
