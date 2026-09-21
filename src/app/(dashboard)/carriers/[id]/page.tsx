import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  Mail,
  Phone,
  ShieldAlert,
  FileText,
  Landmark,
  BadgeCheck,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComplianceStatusBadge, deriveStoredComplianceBadge } from "@/components/carriers/compliance-badge";
import { CarrierComplianceDialog } from "@/components/carriers/carrier-compliance-dialog";
import { VerifyCarrierSafetyButton } from "@/components/carriers/verify-carrier-safety-button";
import { getCarrierById } from "@/lib/repositories/carriers";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const carrier = await getCarrierById(id);
  return {
    title: carrier ? `${carrier.companyName} | Carrier Directory` : "Carrier | FreightLink TMS",
  };
}

// Countdown text for insuranceExpiryDate -- distinct wording for lapsed vs.
// upcoming so the detail page reads correctly regardless of which side of
// deriveComplianceBadge's expired/expiring split (BUG 1,
// lib/domain/carrier-compliance.ts) the date falls on.
function formatInsuranceCountdown(expiryDate: string | null, now: Date = new Date()): string | null {
  if (!expiryDate) {
    return null;
  }

  const diffDays = Math.round(
    (new Date(expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return `Expired ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} ago`;
  }
  if (diffDays === 0) {
    return "Expires today";
  }
  return `Expires in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right">{value}</span>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
        </div>
        {action}
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}

export default async function CarrierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const carrier = await getCarrierById(id);

  if (!carrier) {
    notFound();
  }

  // Same private-bucket signing pattern as carriers/page.tsx, scoped to
  // this one carrier's COI instead of the whole list.
  let coiSignedUrl: string | null = null;
  if (carrier.coiFileUrl) {
    const supabase = await createClient();
    const { data } = await supabase.storage
      .from("carrier-documents")
      .createSignedUrl(carrier.coiFileUrl, 3600);
    coiSignedUrl = data?.signedUrl ?? null;
  }

  const badge = deriveStoredComplianceBadge(carrier);
  const insuranceCountdown = formatInsuranceCountdown(carrier.insuranceExpiryDate);

  return (
    <div className="space-y-6">
      <PageHeader
        title={carrier.companyName}
        subtitle="Full compliance record, insurance, and dispatch contact for this carrier."
        breadcrumbs={[
          { label: "Directory", href: "/carriers" },
          { label: "Carriers", href: "/carriers" },
          { label: carrier.companyName },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/carriers"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Carriers</span>
            </Link>
            <CarrierComplianceDialog
              carrier={carrier}
              coiSignedUrl={coiSignedUrl}
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
                  Compliance
                </button>
              }
            />
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold text-sm">
          {carrier.companyName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-slate-900">{carrier.companyName}</p>
            <ComplianceStatusBadge badge={badge} />
          </div>
          <p className="text-xs font-mono text-slate-500">ID: {carrier.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title="Carrier Identity" icon={Truck}>
          <InfoRow label="Company name" value={carrier.companyName} />
          <InfoRow
            label="MC number"
            value={carrier.mcNumber || <span className="text-slate-400">{"—"}</span>}
          />
          <InfoRow
            label="DOT number"
            value={carrier.dotNumber || <span className="text-slate-400">{"—"}</span>}
          />
        </SectionCard>

        <SectionCard title="Dispatch Contact" icon={Mail}>
          <InfoRow
            label="Email"
            value={
              carrier.contactEmail ? (
                <a
                  href={`mailto:${carrier.contactEmail}`}
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {carrier.contactEmail}
                </a>
              ) : (
                <span className="text-slate-400">{"—"}</span>
              )
            }
          />
          <InfoRow
            label="Phone"
            value={
              carrier.contactPhone ? (
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {carrier.contactPhone}
                </span>
              ) : (
                <span className="text-slate-400">{"—"}</span>
              )
            }
          />
        </SectionCard>

        <SectionCard
          title="Insurance"
          icon={FileText}
          action={
            coiSignedUrl && (
              <a
                href={coiSignedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                View certificate
              </a>
            )
          }
        >
          <InfoRow
            label="Insurance carrier"
            value={carrier.insuranceCarrierName || <span className="text-slate-400">{"—"}</span>}
          />
          <InfoRow
            label="Policy number"
            value={carrier.insurancePolicyNumber || <span className="text-slate-400">{"—"}</span>}
          />
          <InfoRow
            label="Expiry date"
            value={
              carrier.insuranceExpiryDate ? (
                <span className="flex flex-col items-end">
                  <span>{formatDate(carrier.insuranceExpiryDate)}</span>
                  {insuranceCountdown && (
                    <span
                      className={
                        badge === "blocked"
                          ? "text-xs font-semibold text-rose-600"
                          : badge === "expiring"
                            ? "text-xs font-semibold text-amber-600"
                            : "text-xs text-slate-400"
                      }
                    >
                      {insuranceCountdown}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-slate-400">{"—"}</span>
              )
            }
          />
        </SectionCard>

        <SectionCard title="Coverage Limits" icon={Landmark}>
          <InfoRow label="Cargo coverage" value={formatMoney(carrier.cargoCoverageLimit)} />
          <InfoRow label="Auto liability" value={formatMoney(carrier.autoLiabilityLimit)} />
        </SectionCard>

        <SectionCard title="Blacklist Status" icon={ShieldAlert}>
          <InfoRow
            label="Status"
            value={
              carrier.isBlacklisted ? (
                <span className="font-semibold text-rose-600">Blacklisted</span>
              ) : (
                <span className="font-semibold text-emerald-600">Not blacklisted</span>
              )
            }
          />
          {carrier.isBlacklisted && (
            <InfoRow
              label="Reason"
              value={carrier.blacklistReason || <span className="text-slate-400">{"—"}</span>}
            />
          )}
        </SectionCard>

        <SectionCard title="Last Verification" icon={BadgeCheck} action={<VerifyCarrierSafetyButton carrier={carrier} />}>
          <InfoRow
            label="Authority status"
            value={carrier.authorityStatus === "unknown" ? (
              <span className="text-slate-400">Never verified</span>
            ) : (
              carrier.authorityStatus
            )}
          />
          <InfoRow label="Safety rating" value={carrier.safetyRating} />
          <InfoRow
            label="Out of service date"
            value={
              carrier.outOfServiceDate ? (
                formatDate(carrier.outOfServiceDate)
              ) : (
                <span className="text-slate-400">{"—"}</span>
              )
            }
          />
          <InfoRow
            label="Verification source"
            value={carrier.verificationSource || <span className="text-slate-400">{"—"}</span>}
          />
          <InfoRow
            label="Last verified"
            value={
              carrier.lastVerifiedAt ? (
                formatDateTime(carrier.lastVerifiedAt)
              ) : (
                <span className="text-slate-400">Never verified</span>
              )
            }
          />
        </SectionCard>
      </div>
    </div>
  );
}
