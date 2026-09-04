import React from "react";
import Link from "next/link";
import { listAllDocuments } from "@/lib/repositories/documents";
import { listLoads } from "@/lib/repositories/loads";
import { PageBreadcrumb } from "@/components/common/PageBreadCrumb";
import { MetricCard } from "@/components/ui/tailadmin/metric-card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/tailadmin/table";
import { Badge, type BadgeColor } from "@/components/ui/tailadmin/badge";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import type { OcrStatus } from "../../../../types/domain";

export const dynamic = "force-dynamic";

const OCR_BADGE_CONFIG: Record<
  OcrStatus,
  { label: string; color: BadgeColor; icon: React.ReactNode }
> = {
  completed: {
    label: "Extracted",
    color: "success",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  processing: {
    label: "Processing",
    color: "info",
    icon: <Clock className="h-3 w-3" />,
  },
  pending: {
    label: "Pending OCR",
    color: "warning",
    icon: <Clock className="h-3 w-3" />,
  },
  failed: {
    label: "OCR Failed",
    color: "error",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  review_required: {
    label: "Review Required",
    color: "warning",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
};

export default async function DocumentsPage() {
  const [{ data: documents }, { data: loads }] = await Promise.all([
    listAllDocuments({ page: 1, pageSize: 100 }),
    listLoads({}, { page: 1, pageSize: 100 }),
  ]);

  const loadsById = new Map<string, string>();
  loads.forEach((l) => loadsById.set(l.id, l.loadNumber || `LD-${l.id.slice(0, 6).toUpperCase()}`));

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
      <PageBreadcrumb pageTitle="Freight Documents & OCR">
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-400">
          <Sparkles className="h-3.5 w-3.5" />
          AI Document Engine
        </span>
      </PageBreadcrumb>

      {/* KPI Ribbon Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Documents"
          value={documents.length}
          icon={<FileText className="h-6 w-6 text-brand-500" />}
          badgeText="Vault"
          badgeColor="primary"
          subtitle="PODs, BOLs, & Rate Cons"
        />

        <MetricCard
          title="OCR Extracted"
          value={completedCount}
          icon={<CheckCircle2 className="h-6 w-6 text-emerald-500" />}
          badgeText={completedCount > 0 ? "Processed" : "0"}
          badgeColor="success"
          subtitle="Confidence-scored data"
        />

        <MetricCard
          title="Pending Extraction"
          value={pendingCount}
          icon={<Clock className="h-6 w-6 text-amber-500" />}
          badgeText={pendingCount > 0 ? "Queued" : "Clean"}
          badgeColor={pendingCount > 0 ? "warning" : "light"}
          subtitle="In pipeline or background"
        />

        <MetricCard
          title="Review Required"
          value={reviewCount}
          icon={<AlertTriangle className="h-6 w-6 text-rose-500" />}
          badgeText={reviewCount > 0 ? "Action" : "0"}
          badgeColor={reviewCount > 0 ? "error" : "light"}
          subtitle="Confidence < 85% or failed"
        />
      </div>

      {/* Documents Table */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-800 dark:bg-[#18171d]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-gray-800">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
            No documents uploaded
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upload Bills of Lading, Proofs of Delivery, or Rate Confirmations in any load.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableCell isHeader>Document Type</TableCell>
              <TableCell isHeader>Linked Load</TableCell>
              <TableCell isHeader>OCR Engine Status</TableCell>
              <TableCell isHeader>Confidence</TableCell>
              <TableCell isHeader>Upload Date</TableCell>
              <TableCell isHeader className="text-right">File</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => {
              const ocrConfig = OCR_BADGE_CONFIG[doc.ocrStatus] || OCR_BADGE_CONFIG.pending;
              const loadNum = doc.loadId ? loadsById.get(doc.loadId) || doc.loadId.slice(0, 8) : "—";

              return (
                <TableRow key={doc.id}>
                  {/* Type */}
                  <TableCell>
                    <div className="flex items-center gap-2.5 font-semibold text-gray-900 dark:text-white">
                      <FileText className="h-4 w-4 text-brand-500" />
                      <span>{doc.documentType}</span>
                    </div>
                  </TableCell>

                  {/* Load */}
                  <TableCell>
                    {doc.loadId ? (
                      <Link
                        href={`/loads/${doc.loadId}/documents`}
                        className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline dark:text-brand-400 text-xs"
                      >
                        {loadNum}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Unlinked</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge color={ocrConfig.color} size="sm" startIcon={ocrConfig.icon}>
                      {ocrConfig.label}
                    </Badge>
                  </TableCell>

                  {/* Confidence */}
                  <TableCell className="text-xs">
                    {doc.ocrConfidenceScore !== null ? (
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {doc.ocrConfidenceScore}%
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">—</span>
                    )}
                  </TableCell>

                  {/* Upload Date */}
                  <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>

                  {/* Action */}
                  <TableCell className="text-right">
                    {doc.fileUrl ? (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View File
                      </a>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Stored</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
