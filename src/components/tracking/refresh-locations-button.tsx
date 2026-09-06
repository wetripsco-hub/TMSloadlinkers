"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function RefreshLocationsButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleRefresh}
      disabled={isRefreshing}
      aria-label="Refresh driver telemetry and GPS locations"
      className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm shadow-sm transition-colors inline-flex items-center gap-1.5"
    >
      <RefreshCw className={`h-4 w-4 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`} />
      <span>{isRefreshing ? "Refreshing..." : "Refresh Locations"}</span>
    </Button>
  );
}

export default RefreshLocationsButton;
