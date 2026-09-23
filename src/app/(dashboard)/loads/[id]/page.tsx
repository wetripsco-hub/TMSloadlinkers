import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { LoadMapHero } from "@/components/loads/load-map-hero";
import { LoadDetailTabs } from "@/components/loads/load-detail-tabs";
import { LoadNotesPanel } from "@/components/loads/load-notes-panel";
import { SendTrackingLinkButton } from "@/components/loads/send-tracking-link-button";
import { LoadDetailActions } from "@/components/loads/load-detail-actions";
import { RateConfirmationModal } from "@/components/documents/rate-confirmation-modal";
import { getLoadById } from "@/lib/repositories/loads";
import { getCarrierById, listCarriers } from "@/lib/repositories/carriers";
import { getCustomerById, listCustomers } from "@/lib/repositories/customers";
import { listAuditEvents } from "@/lib/repositories/audit";
import { listLoadNotes } from "@/lib/repositories/load-notes";
import { getOrganizationById } from "@/lib/repositories/organizations";
import { listQuotesForLoad, listNegotiationEventsForQuote } from "@/lib/repositories/quotes";
import { canWriteLoads } from "@/lib/auth/load-permissions";
import { isTerminalStatus } from "@/lib/domain/load-status";
import { createClient } from "@/lib/supabase/server";
import { FileText, Navigation, Printer } from "lucide-react";

export const dynamic = "force-dynamic";

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profileData } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const userRole = profileData?.role ?? "viewer";
  const canWrite = canWriteLoads(userRole) && !isTerminalStatus(load.status);

  const [carrier, customer, auditEvents, { data: availableCarriers }, organization, notes, quotes, { data: allCustomers }] =
    await Promise.all([
      load.carrierId ? getCarrierById(load.carrierId) : Promise.resolve(null),
      load.customerId ? getCustomerById(load.customerId) : Promise.resolve(null),
      listAuditEvents("loads", load.id),
      listCarriers({}, { page: 1, pageSize: 100 }),
      getOrganizationById(load.orgId),
      listLoadNotes(load.id),
      listQuotesForLoad(load.id),
      listCustomers({}, { page: 1, pageSize: 200 }),
    ]);

  // Newest quote is the active negotiation thread; older quotes (a
  // previous round that was declined/expired/cancelled) aren't shown here.
  const quote = quotes[0] ?? null;
  const quoteEvents = quote ? await listNegotiationEventsForQuote(quote.id) : [];

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

            <SendTrackingLinkButton loadId={load.id} driverPhone={load.driverPhone} />

            {canWrite && (
              <LoadDetailActions load={load} customers={allCustomers ?? []} />
            )}

            {/* Instant Rate Con Preview / Print Modal */}
            <RateConfirmationModal
              load={load}
              carrier={carrier}
              customer={customer}
              organization={organization}
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

      {/* Turvo-style Split Hero Banner with Leaflet Route Map */}
      <LoadMapHero load={load} customer={customer} />

      {/* Secondary Horizontal Tabs + always-visible notes side panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <LoadDetailTabs
          load={load}
          carrier={carrier}
          availableCarriers={availableCarriers}
          auditEvents={auditEvents}
          organization={organization}
          quote={quote}
          quoteEvents={quoteEvents}
        />
        <LoadNotesPanel loadId={load.id} initialNotes={notes} />
      </div>
    </div>
  );
}

