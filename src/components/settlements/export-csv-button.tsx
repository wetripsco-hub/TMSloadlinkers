"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportSettlementsCsvAction } from "@/app/(dashboard)/settlements/actions";

export function ExportCsvButton() {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const csv = await exportSettlementsCsvAction();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nacha-ach-settlements-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleExport}
      disabled={isExporting}
      aria-label="Export NACHA ACH settlement batch"
      className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm shadow-sm transition-colors inline-flex items-center gap-1.5"
    >
      <Download className="h-4 w-4 text-slate-500" />
      {isExporting ? "Exporting..." : "Export NACHA ACH Batch"}
    </Button>
  );
}
