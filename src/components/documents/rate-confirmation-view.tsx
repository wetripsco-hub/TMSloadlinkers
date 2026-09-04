import { formatCents } from "@/lib/money";
import type { Carrier, Load, LoadStop, Organization } from "../../../types/domain";

function formatStopWindow(stop: LoadStop): string {
  if (!stop.windowStart) return "Appointment Scheduled";
  const start = new Date(stop.windowStart).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  if (!stop.windowEnd) return start;
  return `${start} – ${new Date(stop.windowEnd).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function StopBlock({
  title,
  stop,
  badge,
}: {
  title: string;
  stop: LoadStop;
  badge: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#1f1e28] print:border-gray-300 print:p-2">
      <div className="flex items-center justify-between mb-2">
        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-700 dark:bg-white/10 dark:text-gray-300 print:bg-gray-100 print:text-black">
          {badge}
        </span>
        <span className="text-xs text-gray-500 print:text-black font-medium">
          {formatStopWindow(stop)}
        </span>
      </div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-white print:text-black">
        {stop.facilityName ?? "Facility Dock"}
      </h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 print:text-black mt-0.5">
        {stop.address ?? "—"}
      </p>
      <p className="text-xs text-gray-600 dark:text-gray-400 print:text-black">
        {[stop.city, stop.state, stop.zip].filter(Boolean).join(", ") || "—"}
      </p>
    </div>
  );
}

export function RateConfirmationView({
  load,
  carrier,
  organization,
}: {
  load: Load;
  carrier: (Carrier & { contactEmail?: string | null; contactPhone?: string | null }) | null;
  organization: Organization | null;
}) {
  const loadNum = load.loadNumber || `LD-${load.id.slice(0, 6).toUpperCase()}`;
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const totalPay = load.carrierPay || 0;
  const lineHaul = Math.round(totalPay * 0.88);
  const fuelSurcharge = totalPay - lineHaul;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-8 text-gray-900 shadow-sm dark:border-gray-800 dark:bg-[#16151f] dark:text-white print:max-w-none print:border-none print:shadow-none print:p-0 print:text-black print:bg-white">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b-2 border-gray-900 pb-5 dark:border-gray-700 print:border-black">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 print:text-black">
            Freight Brokerage Rate Agreement
          </span>
          <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white print:text-black">
            {organization?.name ?? "Loadlinkers TMS Brokerage"}
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 print:text-black mt-0.5">
            MC #{organization?.mcNumber ?? "998812"} · USDOT #{organization?.dotNumber ?? "4109822"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 print:text-black">
            Direct Dispatch: (800) 555-5623 · dispatch@loadlinkers.com
          </p>
        </div>

        <div className="mt-4 sm:mt-0 sm:text-right">
          <span className="inline-block rounded-md bg-gray-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white print:bg-black">
            RATE CONFIRMATION
          </span>
          <div className="mt-2 text-xs">
            <p className="font-bold text-gray-900 dark:text-white print:text-black">
              Load Order #: <span className="font-mono text-brand-600 dark:text-brand-400 print:text-black">{loadNum}</span>
            </p>
            <p className="text-gray-500 dark:text-gray-400 print:text-black">
              Date: {today}
            </p>
            <p className="text-gray-500 dark:text-gray-400 print:text-black">
              PO/Ref: REF-{load.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
      </header>

      {/* Carrier & Equipment Spec */}
      <div className="grid gap-4 sm:grid-cols-2 border-b border-gray-200 pb-5 dark:border-gray-800 print:border-gray-300">
        <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 print:bg-white print:border-gray-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 print:text-black">
            Carrier On Record
          </span>
          {carrier ? (
            <div className="mt-2 space-y-1 text-xs">
              <p className="text-sm font-bold text-gray-900 dark:text-white print:text-black">
                {carrier.companyName}
              </p>
              <p className="text-gray-600 dark:text-gray-400 print:text-black">
                MC #{carrier.mcNumber || "—"} · DOT #{carrier.dotNumber || "—"}
              </p>
              <p className="text-gray-600 dark:text-gray-400 print:text-black">
                Contact: {carrier.contactEmail || "dispatch@carrier.com"} · {carrier.contactPhone || "—"}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-500 italic">No carrier assigned yet.</p>
          )}
        </div>

        <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 print:bg-white print:border-gray-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 print:text-black">
            Shipment & Equipment Details
          </span>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 print:text-black">
            <p>Equipment: <span className="font-semibold text-gray-900 dark:text-white print:text-black">{load.equipmentType || "53' Van"}</span></p>
            <p>Commodity: <span className="font-semibold text-gray-900 dark:text-white print:text-black">{load.commodity || "Freight (FAK)"}</span></p>
            <p>Weight: <span className="font-semibold text-gray-900 dark:text-white print:text-black">{load.weightLbs ? `${load.weightLbs.toLocaleString()} lbs` : "42,000 lbs"}</span></p>
            <p>Temp Setting: <span className="font-semibold text-gray-900 dark:text-white print:text-black">{load.temperatureSetting || "Dry / Ambient"}</span></p>
          </div>
        </div>
      </div>

      {/* Itinerary */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white print:text-black">
          Schedule & Route Itinerary
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StopBlock title="Pickup" stop={load.origin} badge="Stop 1 · Shipper Origin" />
          <StopBlock title="Delivery" stop={load.destination} badge="Stop 2 · Consignee Delivery" />
        </div>
      </section>

      {/* Financials */}
      <section className="rounded-xl border border-gray-200 overflow-hidden dark:border-gray-800 print:border-gray-300">
        <div className="grid grid-cols-3 bg-gray-50 p-3 text-xs font-bold text-gray-600 dark:bg-white/[0.03] dark:text-gray-300 print:bg-gray-100 print:text-black">
          <span>Charge Description</span>
          <span className="text-center">Billing Terms</span>
          <span className="text-right">Amount (USD)</span>
        </div>
        <div className="divide-y divide-gray-100 text-xs dark:divide-gray-800 print:divide-gray-200">
          <div className="grid grid-cols-3 p-3">
            <span className="font-medium">Agreed Line Haul Rate</span>
            <span className="text-center text-gray-500 print:text-black">Flat Fee</span>
            <span className="text-right font-mono font-semibold">{formatCents(lineHaul)}</span>
          </div>
          <div className="grid grid-cols-3 p-3">
            <span className="font-medium">Fuel Surcharge (FSC)</span>
            <span className="text-center text-gray-500 print:text-black">Included</span>
            <span className="text-right font-mono font-semibold">{formatCents(fuelSurcharge)}</span>
          </div>
          <div className="grid grid-cols-3 bg-brand-50/60 p-3.5 text-sm font-bold text-gray-900 dark:bg-brand-950/20 dark:text-white print:bg-gray-100 print:text-black">
            <span>TOTAL AGREED CARRIER PAY</span>
            <span className="text-center text-xs font-medium text-brand-600 dark:text-brand-400 print:text-black">Net 30 / QuickPay</span>
            <span className="text-right font-mono text-base text-brand-600 dark:text-brand-400 print:text-black">
              {formatCents(load.carrierPay)}
            </span>
          </div>
        </div>
      </section>

      {/* Legal terms */}
      <section className="rounded-xl bg-gray-50 p-3.5 text-[10px] text-gray-600 dark:bg-white/[0.02] dark:text-gray-400 border border-gray-100 dark:border-gray-800 print:border-gray-200 print:text-black leading-relaxed">
        <p className="font-bold uppercase text-gray-800 dark:text-gray-200 print:text-black mb-1">
          Broker-Carrier Terms of Carriage:
        </p>
        <p>
          1. Carrier agrees to transport load in accordance with all federal and state regulations.
          2. Double brokering, re-brokering, or unauthorized co-brokering will void all freight charges.
          3. Legible signed proof of delivery (POD) and bill of lading must be sent within 24 hours of delivery.
        </p>
      </section>

      {/* Signatures */}
      <footer className="grid grid-cols-2 gap-8 border-t-2 border-gray-900 pt-6 dark:border-gray-700 print:border-black">
        <div>
          <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 print:text-black">
            AUTHORIZED BROKER SIGNATURE
          </p>
          <div className="mt-8 border-b border-gray-400 dark:border-gray-600 print:border-black" />
          <div className="mt-1 flex justify-between text-[10px] text-gray-500 dark:text-gray-400 print:text-black">
            <span>Broker Dispatcher</span>
            <span>Date: {today}</span>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 print:text-black">
            CARRIER SIGN-OFF & ACCEPTANCE
          </p>
          <div className="mt-8 border-b border-gray-400 dark:border-gray-600 print:border-black" />
          <div className="mt-1 flex justify-between text-[10px] text-gray-500 dark:text-gray-400 print:text-black">
            <span>Authorized Driver / Dispatcher</span>
            <span>Date</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
