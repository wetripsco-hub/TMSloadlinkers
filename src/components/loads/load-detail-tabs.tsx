"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  MapPin,
  DollarSign,
  FileText,
  History,
  Calendar,
  Printer,
  ShieldCheck,
  ExternalLink,
  Receipt,
} from "lucide-react";
import { CarrierAssignmentCard } from "@/components/loads/carrier-assignment-card";
import { DriverDispatchCard } from "@/components/loads/driver-dispatch-card";
import { LoadFinancialBreakdown } from "@/components/loads/load-financial-breakdown";
import { LoadAuditTrail } from "@/components/loads/load-audit-trail";
import { StatusProgressionBar } from "@/components/loads/status-progression-bar";
import { QuotePanel } from "@/components/loads/quote-panel";
import { RateConfirmationModal } from "@/components/documents/rate-confirmation-modal";
import { refreshQuoteForLoadAction } from "@/app/(dashboard)/loads/[id]/quotes/actions";
import { formatDateTime, formatMoney, parseFacilityStopAddress } from "@/lib/format";
import type { Load, LoadStop, Organization, Quote, QuoteNegotiationEvent } from "../../../types/domain";
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
  const formatted = parseFacilityStopAddress(stop);

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
        {formatted.street && (
          <span className="text-slate-700 font-medium">{formatted.street}</span>
        )}
        <span className="text-slate-600">{formatted.cityStateZip}</span>

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
  organization?: Organization | null;
  quote: Quote | null;
  quoteEvents: QuoteNegotiationEvent[];
}

// A shipper can accept/decline/counter from the public /quote/[token] page
// at any time, with nothing to push a notification back to an already-open
// load detail tab -- so quote state is polled on an interval rather than
// only refreshed on this broker's own next action or a manual reload. Same
// cadence as the load notes panel's driver-message polling
// (components/loads/load-notes-panel.tsx).
const QUOTE_POLL_INTERVAL_MS = 15000;

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
  organization,
  quote: initialQuote,
  quoteEvents: initialQuoteEvents,
}: LoadDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [quote, setQuote] = useState<Quote | null>(initialQuote);
  const [quoteEvents, setQuoteEvents] = useState<QuoteNegotiationEvent[]>(initialQuoteEvents);
  const quoteNeedsResponse = quote?.status === "countered_by_shipper";

  // Shared by the poll interval below and by QuotePanel's own actions
  // (Send Quote, Accept Counter, Send New Counter) -- both cases want the
  // exact same "fetch the load's current quote + events, replace local
  // state" behavior, just triggered on a different schedule.
  const refreshQuote = useCallback(async () => {
    try {
      const result = await refreshQuoteForLoadAction(load.id);
      setQuote(result.quote);
      setQuoteEvents(result.events);
    } catch {
      // Best-effort -- the next poll tick (or this broker's own next
      // action) retries; a transient failure here shouldn't surface as an
      // error banner for a background refresh nobody explicitly asked for.
    }
  }, [load.id]);

  useEffect(() => {
    const interval = setInterval(refreshQuote, QUOTE_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshQuote]);

  // Deep link from the org-wide Quotes list (components/loads/quotes-list.tsx,
  // app/(dashboard)/quotes/page.tsx) -- the Financials tab panel is
  // conditionally rendered, so #quote-panel only exists in the DOM once this
  // tab is active. Client-only (window read), so this runs after hydration
  // rather than in the initial render.
  useEffect(() => {
    if (window.location.hash === "#quote-panel") {
      Promise.resolve().then(() => setActiveTab("financials"));
    }
  }, []);

  useEffect(() => {
    if (activeTab === "financials" && window.location.hash === "#quote-panel") {
      document.getElementById("quote-panel")?.scrollIntoView({ block: "start" });
    }
  }, [activeTab]);

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
                {tab.id === "financials" && quoteNeedsResponse && (
                  <span
                    className="ml-1 h-2 w-2 rounded-full bg-amber-500"
                    title="Quote needs your response"
                  />
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
              organization={organization}
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

          <DriverDispatchCard load={load} />
        </div>
      )}

      {activeTab === "financials" && (
        <div className="space-y-6">
          <QuotePanel load={load} quote={quote} events={quoteEvents} onQuoteRefresh={refreshQuote} />

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
                  organization={organization}
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
                  organization={organization}
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
