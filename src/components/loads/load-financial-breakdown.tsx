"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import type { FinancialFieldKey } from "@/lib/domain/workspace";
import { useWorkspaceMode } from "@/hooks/use-workspace-mode";
import type { Load } from "../../../types/domain";

const FIELD_LABELS: Record<FinancialFieldKey, string> = {
  shipperRate: "Shipper rate",
  carrierPay: "Carrier pay",
  brokerMargin: "Broker margin",
  dispatcherCommissionEarned: "Dispatcher commission",
};

export function LoadFinancialBreakdown({ load }: { load: Load }) {
  const { visibleFinancialFields, isLoading } = useWorkspaceMode();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financials</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        ) : (
          <dl className="grid grid-cols-2 gap-3">
            {visibleFinancialFields.map((field) => (
              <div key={field} className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">{FIELD_LABELS[field]}</dt>
                <dd className="text-sm font-medium tabular-nums">{formatCents(load[field])}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
