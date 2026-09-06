"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import { LoadTable } from "@/components/loads/load-table";
import { CreateLoadModal } from "@/components/loads/create-load-modal";
import { UploadRateConButton } from "@/components/loads/upload-ratecon-button";
import { PageHeader } from "@/components/layout/page-header";
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
  Plus,
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
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
      {/* Standardized Page Header with Actions */}
      <PageHeader
        title="Freight Loads"
        subtitle="Manage bookings, carrier dispatch, lifecycle statuses, and margins."
        breadcrumbs={[
          { label: "Operations", href: "/overview" },
          { label: "Loads", href: "/loads" },
        ]}
        action={
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
            <UploadRateConButton />
            <TailAdminButton
              variant="primary"
              size="md"
              onClick={() => setIsCreateModalOpen(true)}
              startIcon={<Plus className="h-4 w-4" />}
            >
              + New Load
            </TailAdminButton>
          </div>
        }
      />

      <CreateLoadModal
        customers={customers}
        carriers={carriers}
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => {
          setSeedSuccessMessage("Load created successfully");
          router.refresh();
        }}
        trigger={null}
      />

      {/* Success Notification */}
      {seedSuccessMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{seedSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSeedSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Notification */}
      {seedError && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <span>{seedError}</span>
          </div>
          <button
            onClick={() => setSeedError(null)}
            className="text-rose-600 hover:text-rose-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* 14-Day Free Trial Onboarding Banner (When empty or new) */}
      {loads.length === 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/50 via-white to-sky-50/50 p-6 shadow-sm">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                  <Sparkles className="h-3 w-3" />
                  14-DAY FREE TRIAL ACTIVE
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Self-Serve Onboarding
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                Start Exploring with 1-Click Operational Freight Data
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
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
        <button
          type="button"
          onClick={() => setSelectedStatus((prev) => (prev === "active" ? "ALL" : "active"))}
          className="text-left focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-xl transition-all"
        >
          <MetricCard
            title="Active Loads"
            value={metrics.active}
            icon={<Package className="h-5 w-5 text-blue-600" />}
            badgeText={metrics.active > 0 ? "In Pipeline" : "Empty"}
            badgeColor="primary"
            subtitle="Currently running shipments"
            variant="plausible"
          />
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus((prev) => (prev === "in_transit" ? "ALL" : "in_transit"))}
          className="text-left focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-xl transition-all"
        >
          <MetricCard
            title="In-Transit"
            value={metrics.inTransit}
            icon={<Truck className="h-5 w-5 text-sky-600" />}
            badgeText="On Highway"
            badgeColor="info"
            subtitle="GPS tracking & rolling"
            variant="plausible"
          />
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus((prev) => (prev === "OPEN" ? "ALL" : "OPEN"))}
          className="text-left focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-xl transition-all"
        >
          <MetricCard
            title="Needs Carrier"
            value={metrics.needsCarrier}
            icon={<Clock className="h-5 w-5 text-amber-600" />}
            badgeText={metrics.needsCarrier > 0 ? "Needs Coverage" : "Covered"}
            badgeColor={metrics.needsCarrier > 0 ? "warning" : "success"}
            subtitle="Quoted or open loads"
            variant="plausible"
          />
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus((prev) => (prev === "delivered" ? "ALL" : "delivered"))}
          className="text-left focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-xl transition-all"
        >
          <MetricCard
            title="Delivered"
            value={metrics.delivered}
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            badgeText="Completed"
            badgeColor="success"
            subtitle="POD & delivered freight"
            variant="plausible"
          />
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus((prev) => (prev === "cancelled" ? "ALL" : "cancelled"))}
          className="text-left focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-xl transition-all"
        >
          <MetricCard
            title="Delayed / Exception"
            value={metrics.delayedOrException}
            icon={<AlertCircle className="h-5 w-5 text-rose-600" />}
            badgeText={metrics.delayedOrException > 0 ? "Attention" : "Clear"}
            badgeColor={metrics.delayedOrException > 0 ? "error" : "light"}
            subtitle="Cancelled or flagged"
            variant="plausible"
          />
        </button>
      </div>

      {/* Core Data Table */}
      <LoadTable
        key={selectedStatus ?? "all"}
        loads={loads}
        customers={customers}
        carriers={carriers}
        initialStatus={selectedStatus}
        onCreateLoad={() => setIsCreateModalOpen(true)}
      />
    </div>
  );
}

export default LoadsView;
