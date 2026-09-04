"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/tailadmin/modal";
import { TailAdminButton } from "@/components/ui/tailadmin/form-elements";
import { formatCents } from "@/lib/money";
import {
  FileText,
  Printer,
  Download,
  Building2,
  Truck,
  MapPin,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import type { Load } from "../../../types/domain";
import type { CarrierRecord } from "@/lib/repositories/carriers";
import type { CustomerRecord } from "@/lib/repositories/customers";

export interface RateConfirmationModalProps {
  load: Load;
  carrier?: CarrierRecord | null;
  customer?: CustomerRecord | null;
  organizationName?: string;
  triggerButton?: React.ReactNode;
}

export const RateConfirmationModal: React.FC<RateConfirmationModalProps> = ({
  load,
  carrier,
  customer,
  organizationName = "Loadlinkers TMS Brokerage Inc.",
  triggerButton,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const loadNum = load.loadNumber || `LD-${load.id.slice(0, 6).toUpperCase()}`;
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const pickupDateFormatted = load.origin?.windowStart
    ? new Date(load.origin.windowStart).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Appointment Scheduled";

  const deliveryDateFormatted = load.destination?.windowStart
    ? new Date(load.destination.windowStart).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Appointment Scheduled";

  // Financial breakdown calculation
  const totalPay = load.carrierPay || 0;
  const lineHaul = Math.round(totalPay * 0.88);
  const fuelSurcharge = totalPay - lineHaul;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {triggerButton ? (
        <span onClick={() => setIsOpen(true)} className="cursor-pointer">
          {triggerButton}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 transition-colors"
          title="Generate Rate Confirmation"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Rate Con</span>
        </button>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="4xl"
        className="print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Action Header in Modal */}
        <div className="no-print flex items-center justify-between border-b border-gray-100 pb-4 mb-6 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Carrier Rate Confirmation
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Load {loadNum} · Agreement with {carrier?.companyName || "Assigned Carrier"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TailAdminButton
              variant="outline"
              size="sm"
              onClick={handlePrint}
              startIcon={<Printer className="h-4 w-4" />}
            >
              Print / Save PDF
            </TailAdminButton>
            <TailAdminButton
              variant="primary"
              size="sm"
              onClick={handlePrint}
              startIcon={<Download className="h-4 w-4" />}
            >
              Export PDF
            </TailAdminButton>
          </div>
        </div>

        {/* Printable Rate Confirmation Document Sheet */}
        <div
          id={`rate-con-${load.id}`}
          className="rate-con-document rounded-xl border border-gray-200 bg-white p-6 sm:p-8 text-gray-900 shadow-xs dark:border-gray-800 dark:bg-[#1a1921] dark:text-white print:border-none print:shadow-none print:p-2 print:text-black print:bg-white"
        >
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b-2 border-gray-900 pb-4 dark:border-gray-700 print:border-black">
            <div>
              <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-brand-600 dark:text-brand-400 print:text-black">
                Official Freight Contract
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white print:text-black">
                {organizationName}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 print:text-black mt-0.5">
                Brokerage MC# 998812 · USDOT# 4109822 · SCAC: LDLR
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 print:text-black">
                Dispatch Phone: (800) 555-5623 · Email: dispatch@loadlinkers.com
              </p>
            </div>

            <div className="mt-4 sm:mt-0 sm:text-right">
              <span className="inline-block rounded-md bg-gray-900 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white print:bg-black">
                RATE CONFIRMATION
              </span>
              <div className="mt-2 text-xs">
                <p className="font-bold text-gray-900 dark:text-white print:text-black">
                  Load Order #: <span className="font-mono text-brand-600 dark:text-brand-400 print:text-black">{loadNum}</span>
                </p>
                <p className="text-gray-500 dark:text-gray-400 print:text-black">
                  Date Issued: {today}
                </p>
                <p className="text-gray-500 dark:text-gray-400 print:text-black">
                  Ref / PO #: REF-{load.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Carrier Assignment & Equipment Details */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 border-b border-gray-200 pb-5 dark:border-gray-800 print:border-gray-300">
            {/* Carrier Box */}
            <div className="rounded-lg bg-gray-50 p-3.5 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 print:bg-white print:border-gray-200">
              <div className="flex items-center gap-1.5 mb-2 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 print:text-black">
                <Truck className="h-3.5 w-3.5 text-brand-500" />
                Carrier Information
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white print:text-black">
                {carrier?.companyName || "Carrier On File"}
              </p>
              <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 print:text-black">
                <p>MC #: <span className="font-semibold text-gray-900 dark:text-white print:text-black">{carrier?.mcNumber || "Pending"}</span></p>
                <p>DOT #: <span className="font-semibold text-gray-900 dark:text-white print:text-black">{carrier?.dotNumber || "Pending"}</span></p>
                <p>Phone: <span className="font-semibold text-gray-900 dark:text-white print:text-black">{carrier?.contactPhone || "(555) 012-3456"}</span></p>
                <p>Email: <span className="font-semibold text-gray-900 dark:text-white print:text-black">{carrier?.contactEmail || "dispatch@carrier.com"}</span></p>
              </div>
            </div>

            {/* Equipment & Load Specs */}
            <div className="rounded-lg bg-gray-50 p-3.5 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 print:bg-white print:border-gray-200">
              <div className="flex items-center gap-1.5 mb-2 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 print:text-black">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Equipment & Specifications
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 print:text-black">
                <p>Equipment: <span className="font-semibold text-gray-900 dark:text-white print:text-black">{load.equipmentType || "53' Dry Van"}</span></p>
                <p>Commodity: <span className="font-semibold text-gray-900 dark:text-white print:text-black">{load.commodity || "General Freight (FAK)"}</span></p>
                <p>Weight: <span className="font-semibold text-gray-900 dark:text-white print:text-black">{load.weightLbs ? `${load.weightLbs.toLocaleString()} lbs` : "42,500 lbs"}</span></p>
                <p>Temp Setting: <span className="font-semibold text-gray-900 dark:text-white print:text-black">{load.temperatureSetting || "Ambient / Dry"}</span></p>
              </div>
            </div>
          </div>

          {/* Section: Stops & Route Schedule */}
          <div className="mt-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white print:text-black">
              Route Itinerary & Delivery Schedule
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Stop 1: Pickup / Origin */}
              <div className="relative rounded-lg border border-gray-200 p-4 dark:border-gray-800 print:border-gray-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-black uppercase text-brand-700 dark:bg-brand-500/15 dark:text-brand-400 print:bg-gray-100 print:text-black">
                    Stop 1 · Shipper Pickup
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 print:text-black">
                    {pickupDateFormatted}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white print:text-black">
                  {load.origin?.facilityName || `${customer?.name || "Shipper Facility"}`}
                </h4>
                <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 print:text-black flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  {load.origin?.address || "City, State, Zip"}
                </p>
                <div className="mt-2.5 rounded-md bg-gray-50 p-2 text-[11px] text-gray-600 dark:bg-white/[0.03] dark:text-gray-400 print:bg-gray-50 print:text-black">
                  <span className="font-semibold text-gray-900 dark:text-white print:text-black">Loading Notes: </span>
                  Driver must verify piece count & seal trailer. Clean 53ft trailer required.
                </div>
              </div>

              {/* Stop 2: Delivery / Destination */}
              <div className="relative rounded-lg border border-gray-200 p-4 dark:border-gray-800 print:border-gray-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-black uppercase text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 print:bg-gray-100 print:text-black">
                    Stop 2 · Consignee Delivery
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 print:text-black">
                    {deliveryDateFormatted}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white print:text-black">
                  {load.destination?.facilityName || "Consignee Receiving Dock"}
                </h4>
                <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 print:text-black flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  {load.destination?.address || "City, State, Zip"}
                </p>
                <div className="mt-2.5 rounded-md bg-gray-50 p-2 text-[11px] text-gray-600 dark:bg-white/[0.03] dark:text-gray-400 print:bg-gray-50 print:text-black">
                  <span className="font-semibold text-gray-900 dark:text-white print:text-black">Unloading Notes: </span>
                  Signed Proof of Delivery (POD) required with clear signature and timestamp.
                </div>
              </div>
            </div>
          </div>

          {/* Section: Rate Agreement Table */}
          <div className="mt-5 border-t border-gray-200 pt-4 dark:border-gray-800 print:border-gray-300">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white print:text-black mb-2">
              Agreed Compensation & Payment Terms
            </h3>

            <div className="rounded-lg border border-gray-200 overflow-hidden dark:border-gray-800 print:border-gray-300">
              <div className="grid grid-cols-3 bg-gray-50 p-2.5 text-xs font-bold text-gray-600 dark:bg-white/[0.03] dark:text-gray-300 print:bg-gray-100 print:text-black">
                <span>Description</span>
                <span className="text-center">Terms</span>
                <span className="text-right">Agreed Amount (USD)</span>
              </div>
              <div className="divide-y divide-gray-100 text-xs dark:divide-gray-800 print:divide-gray-200">
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-medium text-gray-900 dark:text-white print:text-black">Line Haul Agreement</span>
                  <span className="text-center text-gray-500 print:text-black">Fixed Carrier Rate</span>
                  <span className="text-right font-mono font-semibold">{formatCents(lineHaul)}</span>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-medium text-gray-900 dark:text-white print:text-black">Fuel Surcharge (FSC)</span>
                  <span className="text-center text-gray-500 print:text-black">Included</span>
                  <span className="text-right font-mono font-semibold">{formatCents(fuelSurcharge)}</span>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-medium text-gray-900 dark:text-white print:text-black">Accessorials & Detention</span>
                  <span className="text-center text-gray-500 print:text-black">$50/hr after 2 hrs free; TONU $150</span>
                  <span className="text-right font-mono text-gray-600 dark:text-gray-300 print:text-black">$0.00 / As Agreed</span>
                </div>
                <div className="grid grid-cols-3 bg-brand-50/50 p-3 text-sm font-bold text-gray-900 dark:bg-brand-950/20 dark:text-white print:bg-gray-100 print:text-black">
                  <span>TOTAL AGREED CARRIER PAY</span>
                  <span className="text-center text-xs font-medium text-brand-600 dark:text-brand-400 print:text-black">Standard Net 30 / QuickPay</span>
                  <span className="text-right font-mono text-base text-brand-600 dark:text-brand-400 print:text-black">
                    {formatCents(load.carrierPay)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Standard Legal Terms */}
          <div className="mt-5 rounded-lg bg-gray-50 p-3.5 text-[10px] text-gray-600 dark:bg-white/[0.02] dark:text-gray-400 border border-gray-100 dark:border-gray-800 print:border-gray-200 print:text-black">
            <p className="font-bold uppercase text-gray-800 dark:text-gray-200 print:text-black mb-1">
              Standard Broker-Carrier Contract Terms:
            </p>
            <p className="leading-normal">
              1. <strong>NO DOUBLE BROKERING:</strong> Re-brokering, trip-leasing, or unauthorized assignment of this shipment to any other carrier or co-broker is strictly prohibited and shall result in total forfeiture of payment.
              2. <strong>COMPLIANCE:</strong> Carrier warrants having active FMCSA operating authority and minimum insurance of $100,000 Cargo and $1,000,000 Auto Liability.
              3. <strong>BILLING REQUIREMENTS:</strong> A clean, legible signed Proof of Delivery (POD) must be submitted with carrier invoice within 24 hours of delivery.
            </p>
          </div>

          {/* Signature Sign-Off Block */}
          <div className="mt-6 grid grid-cols-2 gap-8 border-t-2 border-gray-900 pt-5 dark:border-gray-700 print:border-black">
            <div>
              <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 print:text-black">
                AUTHORIZED BROKER REPRESENTATIVE
              </p>
              <div className="mt-6 border-b border-gray-400 dark:border-gray-600 print:border-black" />
              <div className="mt-1 flex justify-between text-[10px] text-gray-500 dark:text-gray-400 print:text-black">
                <span>Authorized Signature</span>
                <span>Date: {today}</span>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 print:text-black">
                CARRIER ACCEPTANCE & SIGN-OFF
              </p>
              <div className="mt-6 border-b border-gray-400 dark:border-gray-600 print:border-black" />
              <div className="mt-1 flex justify-between text-[10px] text-gray-500 dark:text-gray-400 print:text-black">
                <span>Authorized Representative Signature</span>
                <span>Date</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default RateConfirmationModal;
