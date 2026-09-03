"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
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
      link.download = `carrier-settlements-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleExport} disabled={isExporting}>
      {isExporting ? "Exporting..." : "Export CSV"}
    </Button>
  );
}
