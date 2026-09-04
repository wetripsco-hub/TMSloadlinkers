"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import { LoadTable } from "@/components/loads/load-table";
import { CreateLoadModal } from "@/components/loads/create-load-modal";
import { PageBreadcrumb } from "@/components/common/PageBreadCrumb";
import { TailAdminButton } from "@/components/ui/tailadmin/form-elements";
import { seedDemoDataAction } from "@/app/(dashboard)/loads/actions";
import {
  Package,
  Truck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Building2,
  ShieldCheck,
} from "lucide-react";
import type { Load } from "../../../types/domain";
import type { CustomerRecord } from "@/lib/repositories/customers";
import type { CarrierRecord } from "@/lib/repositories/carriers";

export interface LoadsViewProps {
  loads: Load[];
  customers: CustomerRecord[];
  carriers: CarrierRecord[];
  initialStatus?: string;
}

export function LoadsView({ loads, customers, carriers, initialStatus }: LoadsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [seedSuccessMessage, setSeedSuccessMessage] = useState<string | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  // KPI Metrics calculation
  const metrics = useMemo(() => {
    let active = 0;
    let inTransit = 0;
    let needsCarrier = 0;
    let delivered = 0;
    let delayedOrException = 0;

    loads.forEach((load) => {
      // Active = any load not delivered, invoiced, settled, or cancelled
      if (
        load.status !== "delivered" &&
        load.status !== "pod_uploaded" &&
        load.status !== "invoiced" &&
        load.status !== "settled" &&
        load.status !== "cancelled"
      ) {
        active++;
      }

      // In Transit
      if (load.status === "in_transit" || load.status === "at_delivery") {
        inTransit++;
      }

      // Needs Carrier
      if (!load.carrierId || load.status === "quoted" || load.status === "posted_to_boards") {
        needsCarrier++;
      }

      // Delivered
      if (
        load.status === "delivered" ||
        load.status === "pod_uploaded" ||
        load.status === "invoiced" ||
        load.status === "settled"
      ) {
        delivered++;
      }

      // Delayed / Cancelled / Exception
      if (load.status === "cancelled") {
        delayedOrException++;
      }
    });

    return {
      active,
      inTransit,
      needsCarrier,
      delivered,
      delayedOrException,
    };
  }, [loads]);

  const handleSeedData = () => {
    setSeedError(null);
    setSeedSuccessMessage(null);
    startTransition(async () => {
      try {
        const res = await seedDemoDataAction();
        setSeedSuccessMessage(
          `Demo data injected: ${res.customersCount} shippers, ${res.carriersCount} carriers, ${res.loadsCount} loads, and ${res.invoicesCount} invoices.`
        );
        router.refresh();
      } catch (err) {
        setSeedError(err instanceof Error ? err.message : "Failed to inject demo data");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header with Actions */}
      <PageBreadcrumb pageTitle="Freight Loads">
        <div className="flex items-center gap-2">
          <TailAdminButton
            variant="outline"
            size="md"
            onClick={handleSeedData}
            loading={isPending}
            startIcon={<Sparkles className="h-4 w-4 text-amber-500" />}
            title="Inject sample shippers, carriers, loads & invoices"
          >
            {isPending ? "Loading..." : "Load Sample Data"}
          </TailAdminButton>
          <CreateLoadModal customers={customers} carriers={carriers} />
        </div>
      </PageBreadcrumb>

      {/* Success Notification */}
      {seedSuccessMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{seedSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSeedSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Notification */}
      {seedError && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <span>{seedError}</span>
          </div>
          <button
            onClick={() => setSeedError(null)}
            className="text-rose-600 hover:text-rose-800 dark:text-rose-400"
          >
            ✕
          </button>
        </div>
      )}

      {/* 14-Day Free Trial Onboarding Banner (When empty or new) */}
      {loads.length === 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 via-white to-sky-50 p-6 shadow-sm dark:border-brand-900/50 dark:from-[#1e1d27] dark:via-[#191822] dark:to-[#16202c]">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/15 px-2.5 py-0.5 text-[11px] font-bold text-brand-600 dark:text-brand-400">
                  <Sparkles className="h-3 w-3" />
                  14-DAY FREE TRIAL ACTIVE
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Self-Serve Onboarding
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                Start Exploring with 1-Click Operational Freight Data
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                Populate your new workspace with 3 realistic shippers, 4 compliant carriers, 9 active shipments across various stages, and live billing invoices.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <TailAdminButton
                variant="primary"
                size="md"
                onClick={handleSeedData}
                loading={isPending}
                startIcon={<RefreshCw className="h-4 w-4" />}
              >
                {isPending ? "Generating Demo..." : "Load Sample Data"}
              </TailAdminButton>
            </div>
          </div>
        </div>
      )}

      {/* KPI Ribbon Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Active Loads"
          value={metrics.active}
          icon={<Package className="h-6 w-6 text-brand-500" />}
          badgeText={metrics.active > 0 ? "In Pipeline" : "Empty"}
          badgeColor="primary"
          subtitle="Currently running shipments"
        />

        <MetricCard
          title="In-Transit"
          value={metrics.inTransit}
          icon={<Truck className="h-6 w-6 text-sky-500" />}
          badgeText="On Highway"
          badgeColor="info"
          subtitle="GPS tracking & rolling"
        />

        <MetricCard
          title="Needs Carrier"
          value={metrics.needsCarrier}
          icon={<Clock className="h-6 w-6 text-amber-500" />}
          badgeText={metrics.needsCarrier > 0 ? "Needs Coverage" : "Covered"}
          badgeColor={metrics.needsCarrier > 0 ? "warning" : "success"}
          subtitle="Quoted or open loads"
        />

        <MetricCard
          title="Delivered"
          value={metrics.delivered}
          icon={<CheckCircle2 className="h-6 w-6 text-emerald-500" />}
          badgeText="Completed"
          badgeColor="success"
          subtitle="POD & delivered freight"
        />

        <MetricCard
          title="Delayed / Exception"
          value={metrics.delayedOrException}
          icon={<AlertCircle className="h-6 w-6 text-rose-500" />}
          badgeText={metrics.delayedOrException > 0 ? "Attention" : "Clear"}
          badgeColor={metrics.delayedOrException > 0 ? "error" : "light"}
          subtitle="Cancelled or flagged"
        />
      </div>

      {/* Core Data Table */}
      <LoadTable
        loads={loads}
        customers={customers}
        carriers={carriers}
        initialStatus={initialStatus}
      />
    </div>
  );
}

export default LoadsView;
