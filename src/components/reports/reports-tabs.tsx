"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FinancialTab, type FinancialTabProps } from "@/components/reports/financial-tab";
import { OperationalTab, type OperationalTabProps } from "@/components/reports/operational-tab";

export interface ReportsTabsProps {
  financial: FinancialTabProps;
  operational: OperationalTabProps;
}

// All aggregation already happened server-side (the RSC page fetched both
// tabs' data up front via lib/repositories/reports.ts) -- switching tabs
// here is pure client-side visibility toggling, no refetch, no recompute.
export function ReportsTabs({ financial, operational }: ReportsTabsProps) {
  return (
    <Tabs defaultValue="financial">
      <TabsList>
        <TabsTrigger value="financial">Financial</TabsTrigger>
        <TabsTrigger value="operational">Operational</TabsTrigger>
      </TabsList>
      <TabsContent value="financial" className="pt-4">
        <FinancialTab {...financial} />
      </TabsContent>
      <TabsContent value="operational" className="pt-4">
        <OperationalTab {...operational} />
      </TabsContent>
    </Tabs>
  );
}
