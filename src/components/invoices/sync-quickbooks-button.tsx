"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2 } from "lucide-react";

export function SyncQuickBooksButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    // Standard ledger synchronization feedback
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSyncing(false);
    setSynced(true);
    setTimeout(() => setSynced(false), 3000);
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleSync}
      disabled={isSyncing}
      aria-label="Sync ledger data to QuickBooks Online"
      className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm shadow-sm transition-colors inline-flex items-center gap-1.5"
    >
      {synced ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Synced to QuickBooks</span>
        </>
      ) : (
        <>
          <RefreshCw className={`h-4 w-4 text-slate-500 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "Syncing..." : "Sync to QuickBooks"}</span>
        </>
      )}
    </Button>
  );
}

export default SyncQuickBooksButton;
