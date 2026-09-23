"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import { LoadTable } from "@/components/loads/load-table";
import { CreateLoadModal } from "@/components/loads/create-load-modal";
import { UploadRateConButton } from "@/components/loads/upload-ratecon-button";
import { PageHeader } from "@/components/layout/page-header";
import { TailAdminButton } from "@/components/ui/tailadmin/form-elements";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
} from "lucide-react";
import type { Load, Organization } from "../../../types/domain";
import type { CustomerRecord } from "@/lib/repositories/customers";
import type { CarrierRecord } from "@/lib/repositories/carriers";

export interface LoadsViewProps {
  loads: Load[];
  customers: CustomerRecord[];
  carriers: CarrierRecord[];
  organization?: Organization | null;
  initialStatus?: string;
  initialNoCarrier?: boolean;
  initialPendingPod?: boolean;
  completedPodLoadIds?: string[];
  unreadNoteLoadIds?: string[];
}

export function LoadsView({
  loads,
  customers,
  carriers,
  organization,
  initialStatus,
  initialNoCarrier,
  initialPendingPod,
  completedPodLoadIds,
  unreadNoteLoadIds,
}: LoadsViewProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(initialStatus);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
          setSuccessMessage("Load created successfully");
          router.refresh();
        }}
        trigger={null}
      />

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            ✕
          </button>
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
        organization={organization}
        initialStatus={selectedStatus}
        initialNoCarrier={initialNoCarrier}
        initialPendingPod={initialPendingPod}
        completedPodLoadIds={completedPodLoadIds}
        unreadNoteLoadIds={unreadNoteLoadIds}
        onCreateLoad={() => setIsCreateModalOpen(true)}
      />
    </div>
  );
}

export default LoadsView;
