"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  MapPin,
  DollarSign,
  FileText,
  History,
  Calendar,
  Truck,
  Printer,
  ShieldCheck,
  ExternalLink,
  Navigation,
  Receipt,
} from "lucide-react";
import { CarrierAssignmentCard } from "@/components/loads/carrier-assignment-card";
import { LoadFinancialBreakdown } from "@/components/loads/load-financial-breakdown";
import { LoadAuditTrail } from "@/components/loads/load-audit-trail";
import { StatusProgressionBar } from "@/components/loads/status-progression-bar";
import { RateConfirmationModal } from "@/components/documents/rate-confirmation-modal";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { Load, LoadStop } from "../../../types/domain";
import type { CarrierRecord } from "@/lib/repositories/carriers";
import type { AuditEvent } from "@/lib/repositories/audit";

export function StopDetailsCard({
  title,
  stop,
  isOrigin,
}: {
  title: string;
  stop: LoadStop;
  isOrigin?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              isOrigin
                ? "bg-blue-50 text-blue-600 border border-blue-200"
                : "bg-emerald-50 text-emerald-600 border border-emerald-200"
            }`}
          >
            <MapPin className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
        </div>
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
            isOrigin
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          {isOrigin ? "Pickup" : "Dropoff"}
        </span>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-slate-900 text-base">
          {stop.facilityName ?? (isOrigin ? "Origin Facility" : "Destination Facility")}
        </span>
        <span className="text-slate-600">{stop.address ?? "—"}</span>
        <span className="text-slate-600">
          {[stop.city, stop.state, stop.zip].filter(Boolean).join(", ") || "—"}
        </span>

        <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-700">
          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>
            Window: {stop.windowStart ? formatDateTime(stop.windowStart) : "Appointment Scheduled"}
            {stop.windowEnd ? ` – ${formatDateTime(stop.windowEnd)}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

export interface LoadDetailTabsProps {
  load: Load;
  carrier: CarrierRecord | null;
  availableCarriers: CarrierRecord[];
  auditEvents: AuditEvent[];
}

type TabKey = "summary" | "stops" | "financials" | "documents" | "audit";

interface TabItem {
  id: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: "summary", label: "Summary", icon: LayoutDashboard },
  { id: "stops", label: "Stops & Routing", icon: MapPin },
  { id: "financials", label: "Financials", icon: DollarSign },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "audit", label: "Audit Trail", icon: History },
];

export function LoadDetailTabs({
  load,
  carrier,
  availableCarriers,
  auditEvents,
}: LoadDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("summary");

  return (
    <div className="space-y-6">
      {/* Secondary Horizontal Tabs Header */}
      <div className="border-b border-slate-200 bg-white rounded-xl shadow-sm px-4 pt-1">
        <nav className="flex items-center gap-2 overflow-x-auto scrollbar-none" aria-label="Load Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm transition-all border-b-2 -mb-px whitespace-nowrap ${
                  isActive
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 font-medium"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.id === "audit" && auditEvents.length > 0 && (
                  <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                    {auditEvents.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          {/* Lifecycle Progression */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Lifecycle Progression
              </h2>
            </div>
            <StatusProgressionBar load={load} />
          </div>

          {/* Stops Quick View */}
          <div className="grid gap-4 md:grid-cols-2">
            <StopDetailsCard title="Origin Pickup" stop={load.origin} isOrigin={true} />
            <StopDetailsCard title="Destination Delivery" stop={load.destination} isOrigin={false} />
          </div>

          {/* Carrier & Financial Summary */}
          <div className="grid gap-4 md:grid-cols-2">
            <CarrierAssignmentCard
              load={load}
              assignedCarrier={carrier}
              availableCarriers={availableCarriers}
            />
            <LoadFinancialBreakdown load={load} />
          </div>

          {/* Audit trail preview */}
          {auditEvents.length > 0 && <LoadAuditTrail events={auditEvents} />}
        </div>
      )}

      {activeTab === "stops" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <StopDetailsCard title="Origin Pickup (Stop 1)" stop={load.origin} isOrigin={true} />
            <StopDetailsCard title="Destination Delivery (Stop 2)" stop={load.destination} isOrigin={false} />
          </div>

          {/* Driver & Telemetry Details Card */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Truck className="h-4 w-4 text-slate-400" />
                Assigned Driver & Telemetry
              </h3>
              <Link
                href={`/loads/${load.id}/tracking`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Navigation className="h-3.5 w-3.5" />
                Live Telemetry Portal
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <span className="text-slate-400 block mb-1">Driver Name</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {load.driverName || "Driver not assigned"}
                </span>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <span className="text-slate-400 block mb-1">Driver Phone</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {load.driverPhone || "—"}
                </span>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <span className="text-slate-400 block mb-1">Tractor / Trailer</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {load.truckNumber || "—"} / {load.trailerNumber || "—"}
                </span>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <span className="text-slate-400 block mb-1">Last GPS Ping</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {load.lastPingAt ? formatDateTime(load.lastPingAt) : "No ping recorded"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "financials" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <LoadFinancialBreakdown load={load} />

            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-slate-400" />
                    Billing & Rate Terms
                  </h3>
                </div>

                <dl className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <dt className="text-slate-500">Shipper Total Billing</dt>
                    <dd className="font-semibold text-slate-900">{formatMoney(load.shipperRate)}</dd>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <dt className="text-slate-500">Carrier Settlement Pay</dt>
                    <dd className="font-semibold text-slate-900">{formatMoney(load.carrierPay)}</dd>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <dt className="text-slate-500">Net Broker Margin</dt>
                    <dd className="font-semibold text-emerald-600">{formatMoney(load.brokerMargin)}</dd>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <dt className="text-slate-500">Customer PO Number</dt>
                    <dd className="font-semibold text-slate-700">{load.customerPoNumber || "—"}</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Link
                  href="/invoices"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
                >
                  <Receipt className="h-3.5 w-3.5 text-slate-400" />
                  <span>Shipper Invoices</span>
                </Link>
                <RateConfirmationModal
                  load={load}
                  carrier={carrier}
                  triggerButton={
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
                    >
                      <Printer className="h-3.5 w-3.5 text-slate-400" />
                      <span>View Rate Confirmation</span>
                    </button>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                Shipment Documents & Rate Con
              </h3>
              <div className="flex items-center gap-2">
                <RateConfirmationModal
                  load={load}
                  carrier={carrier}
                  triggerButton={
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                    >
                      <Printer className="h-3.5 w-3.5 text-slate-400" />
                      Generate Rate Con
                    </button>
                  }
                />
                <Link
                  href={`/loads/${load.id}/documents`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Document Center
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-slate-900">Rate Confirmation</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    carrier ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {carrier ? "Ready to Issue" : "Awaiting Carrier"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Official broker-carrier rate confirmation sheet.</p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-slate-900">Bill of Lading (BOL)</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    Pending Pickup
                  </span>
                </div>
                <p className="text-xs text-slate-500">Shipper bill of lading and commodity release.</p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-slate-900">Proof of Delivery (POD)</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    load.status === "delivered" || load.status === "pod_uploaded" || load.status === "settled"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {load.status === "delivered" || load.status === "pod_uploaded" || load.status === "settled" ? "Delivered" : "Pending Drop"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Signed consignee delivery receipt document.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="space-y-6">
          <LoadAuditTrail events={auditEvents} />
        </div>
      )}
    </div>
  );
}

export default LoadDetailTabs;
