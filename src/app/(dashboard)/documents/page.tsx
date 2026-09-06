import React from "react";
import type { Metadata } from "next";
import { listAllDocuments } from "@/lib/repositories/documents";
import { listLoads } from "@/lib/repositories/loads";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import { BulkPodUploadModal } from "@/components/documents/bulk-pod-upload-modal";
import { DocumentsTable } from "@/components/documents/documents-table";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Documents & OCR | FreightLink TMS",
};

export default async function DocumentsPage() {
  const [{ data: documents }, { data: loads }] = await Promise.all([
    listAllDocuments({ page: 1, pageSize: 100 }),
    listLoads({}, { page: 1, pageSize: 200 }),
  ]);

  const loadsById = new Map<string, string>();
  loads.forEach((l) => loadsById.set(l.id, l.loadNumber || `LD-${l.id.slice(0, 6).toUpperCase()}`));

  const loadOptions = loads.map((l) => ({
    value: l.id,
    label: l.loadNumber || `LD-${l.id.slice(0, 6).toUpperCase()}`,
  }));

  const supabase = await createClient();
  const paths = documents.map((d) => d.fileUrl).filter(Boolean);
  const { data: signedUrls } = await supabase.storage
    .from("load-documents")
    .createSignedUrls(paths, 3600); // 1 hour expiry

  const signedUrlByPath = new Map<string, string>();
  (signedUrls ?? []).forEach((entry) => {
    if (entry.path && entry.signedUrl) {
      signedUrlByPath.set(entry.path, entry.signedUrl);
    }
  });

  let completedCount = 0;
  let pendingCount = 0;
  let reviewCount = 0;

  documents.forEach((doc) => {
    if (doc.ocrStatus === "completed") completedCount++;
    else if (doc.ocrStatus === "pending" || doc.ocrStatus === "processing") pendingCount++;
    else if (doc.ocrStatus === "review_required" || doc.ocrStatus === "failed") reviewCount++;
  });

  return (
    <div className="space-y-6">
      {/* Standardized Page Header with Action */}
      <PageHeader
        title="Documents & OCR Processing"
        subtitle="Upload rate confirmations and bills of lading with automated telemetry parsing."
        breadcrumbs={[
          { label: "Operations", href: "/overview" },
          { label: "Documents", href: "/documents" },
        ]}
        action={<BulkPodUploadModal triggerLabel="Upload Document" />}
      />

      {/* KPI Ribbon Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Documents"
          value={documents.length}
          icon={<FileText className="h-5 w-5 text-blue-600" />}
          badgeText="Vault"
          badgeColor="primary"
          subtitle="PODs, BOLs, & Rate Cons"
          variant="plausible"
        />

        <MetricCard
          title="OCR Extracted"
          value={completedCount}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          badgeText={completedCount > 0 ? "Processed" : "0"}
          badgeColor="success"
          subtitle="Confidence-scored data"
          variant="plausible"
        />

        <MetricCard
          title="Pending Extraction"
          value={pendingCount}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          badgeText={pendingCount > 0 ? "Queued" : "Clean"}
          badgeColor={pendingCount > 0 ? "warning" : "light"}
          subtitle="In pipeline or background"
          variant="plausible"
        />

        <MetricCard
          title="Review Required"
          value={reviewCount}
          icon={<AlertTriangle className="h-5 w-5 text-rose-600" />}
          badgeText={reviewCount > 0 ? "Action" : "0"}
          badgeColor={reviewCount > 0 ? "error" : "light"}
          subtitle="Confidence < 85% or failed"
          variant="plausible"
        />
      </div>

      {/* Main Documents Table Component */}
      <DocumentsTable
        documents={documents.map((d) => ({
          id: d.id,
          loadId: d.loadId,
          documentType: d.documentType,
          fileUrl: d.fileUrl,
          ocrStatus: d.ocrStatus,
          ocrConfidenceScore: d.ocrConfidenceScore,
          uploadedAt: d.uploadedAt,
        }))}
        loadsById={Object.fromEntries(loadsById)}
        loadOptions={loadOptions}
        signedUrlByPath={Object.fromEntries(signedUrlByPath)}
      />
    </div>
  );
}
