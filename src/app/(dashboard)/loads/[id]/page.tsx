import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { StatusProgressionBar } from "@/components/loads/status-progression-bar";
import { LoadFinancialBreakdown } from "@/components/loads/load-financial-breakdown";
import { LoadAuditTrail } from "@/components/loads/load-audit-trail";
import { PageBreadcrumb } from "@/components/common/PageBreadCrumb";
import { CarrierAssignmentCard } from "@/components/loads/carrier-assignment-card";
import { RateConfirmationModal } from "@/components/documents/rate-confirmation-modal";
import { getLoadById } from "@/lib/repositories/loads";
import { getCarrierById, listCarriers } from "@/lib/repositories/carriers";
import { listAuditEvents } from "@/lib/repositories/audit";
import { FileText, Navigation, Printer } from "lucide-react";
import type { LoadStop } from "../../../../../types/domain";

export const dynamic = "force-dynamic";

function StopDetails({ title, stop }: { title: string; stop: LoadStop }) {
  return (
    <Card className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-xs">
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-gray-900 dark:text-white">{stop.facilityName ?? "Facility"}</span>
        <span className="text-gray-600 dark:text-gray-400">{stop.address ?? "—"}</span>
        <span className="text-gray-600 dark:text-gray-400">
          {[stop.city, stop.state, stop.zip].filter(Boolean).join(", ") || "—"}
        </span>
        <span className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-1">
          Window: {stop.windowStart ? new Date(stop.windowStart).toLocaleString() : "—"}
          {stop.windowEnd ? ` – ${new Date(stop.windowEnd).toLocaleString()}` : ""}
        </span>
      </CardContent>
    </Card>
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
      <PageBreadcrumb
        pageTitle={`Load ${loadLabel}`}
        items={[
          { label: "Loads", href: "/loads" },
          { label: loadLabel },
        ]}
      >
        <div className="flex items-center gap-2">
          <Link
            href={`/loads/${load.id}/documents`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-brand-500" />
            Documents
          </Link>

          {/* Instant Rate Con Preview / Print Modal */}
          <RateConfirmationModal
            load={load}
            carrier={carrier}
            triggerButton={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
              >
                <Printer className="h-3.5 w-3.5 text-brand-500" />
                Generate Rate Con
              </button>
            }
          />

          <Link
            href={`/loads/${load.id}/tracking`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-600 transition-colors"
          >
            <Navigation className="h-3.5 w-3.5" />
            Live Tracking
          </Link>
        </div>
      </PageBreadcrumb>

      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Current Status:
        </span>
        <LoadStatusBadge status={load.status} />
      </div>

      <Card className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Lifecycle Progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatusProgressionBar load={load} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <StopDetails title="Origin Pickup" stop={load.origin} />
        <StopDetails title="Destination Delivery" stop={load.destination} />
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
