import { notFound } from "next/navigation";
import Link from "next/link";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { StatusProgressionBar } from "@/components/loads/status-progression-bar";
import { LoadFinancialBreakdown } from "@/components/loads/load-financial-breakdown";
import { LoadAuditTrail } from "@/components/loads/load-audit-trail";
import { PageHeader } from "@/components/layout/page-header";
import { CarrierAssignmentCard } from "@/components/loads/carrier-assignment-card";
import { RateConfirmationModal } from "@/components/documents/rate-confirmation-modal";
import { getLoadById } from "@/lib/repositories/loads";
import { getCarrierById, listCarriers } from "@/lib/repositories/carriers";
import { listAuditEvents } from "@/lib/repositories/audit";
import { formatDateTime } from "@/lib/format";
import { FileText, Navigation, Printer, MapPin, Calendar } from "lucide-react";
import type { LoadStop } from "../../../../../types/domain";

export const dynamic = "force-dynamic";

function StopDetails({
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
          {stop.facilityName ?? "Facility Dock"}
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

export default async function LoadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const load = await getLoadById(id);

  if (!load) {
    notFound();
  }

  const [carrier, auditEvents, { data: availableCarriers }] = await Promise.all([
    load.carrierId ? getCarrierById(load.carrierId) : Promise.resolve(null),
    listAuditEvents("loads", load.id),
    listCarriers({}, { page: 1, pageSize: 100 }),
  ]);

  const loadLabel = load.loadNumber || `LD-${load.id.slice(0, 6).toUpperCase()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Load ${loadLabel}`}
        subtitle={`Dispatch status, financial details, and audit trail for shipment ${loadLabel}.`}
        breadcrumbs={[
          { label: "Operations", href: "/overview" },
          { label: "Loads", href: "/loads" },
          { label: loadLabel },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/loads/${load.id}/documents`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Documents
            </Link>

            {/* Instant Rate Con Preview / Print Modal */}
            <RateConfirmationModal
              load={load}
              carrier={carrier}
              triggerButton={
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-400" />
                  Generate Rate Con
                </button>
              }
            />

            <Link
              href={`/loads/${load.id}/tracking`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Navigation className="h-3.5 w-3.5" />
              Live Tracking
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Current Status:
          </span>
          <LoadStatusBadge status={load.status} />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>Equipment: <strong className="text-slate-900 font-semibold">{load.equipmentType || "53' Dry Van"}</strong></span>
          <span>Commodity: <strong className="text-slate-900 font-semibold">{load.commodity || "General Freight"}</strong></span>
          {load.weightLbs && (
            <span>Weight: <strong className="text-slate-900 font-semibold">{load.weightLbs.toLocaleString()} lbs</strong></span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Lifecycle Progression
          </h2>
        </div>
        <StatusProgressionBar load={load} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StopDetails title="Origin Pickup" stop={load.origin} isOrigin={true} />
        <StopDetails title="Destination Delivery" stop={load.destination} isOrigin={false} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CarrierAssignmentCard
          load={load}
          assignedCarrier={carrier}
          availableCarriers={availableCarriers}
        />

        <LoadFinancialBreakdown load={load} />
      </div>

      <LoadAuditTrail events={auditEvents} />
    </div>
  );
}
