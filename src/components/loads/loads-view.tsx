"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { LoadTable } from "@/components/loads/load-table";
import { LoadKanban } from "@/components/loads/load-kanban";
import { useWorkspaceMode } from "@/hooks/use-workspace-mode";
import type { Load } from "../../../types/domain";

type ViewMode = "table" | "kanban";

export function LoadsView({ loads }: { loads: Load[] }) {
  const [view, setView] = useState<ViewMode>("table");
  const { visibleFinancialFields, isLoading } = useWorkspaceMode();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-lg font-medium">Loads</h1>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={view === "table" ? "default" : "outline"}
            onClick={() => setView("table")}
          >
            Table
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "kanban" ? "default" : "outline"}
            onClick={() => setView("kanban")}
          >
            Kanban
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Loading workspace...
        </div>
      ) : view === "table" ? (
        <LoadTable loads={loads} visibleFinancialFields={visibleFinancialFields} />
      ) : (
        <LoadKanban loads={loads} visibleFinancialFields={visibleFinancialFields} />
      )}
    </div>
  );
}
