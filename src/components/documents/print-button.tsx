"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export interface PrintButtonProps {
  children?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

export function PrintButton({
  children,
  className,
  showIcon = true,
}: PrintButtonProps = {}) {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className={`inline-flex items-center gap-1.5 font-semibold ${className || ""}`}
    >
      {showIcon && <Printer className="h-4 w-4" />}
      <span>{children || "Print / Save PDF"}</span>
    </Button>
  );
}

