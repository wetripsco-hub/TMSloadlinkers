"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/tailadmin/table";
import { EmptyState } from "@/components/ui/empty-state";
import { BulkPodUploadModal } from "@/components/documents/bulk-pod-upload-modal";
import { ManualLinkControl } from "@/components/documents/manual-link-control";
import { formatDate, formatNullableNumber } from "@/lib/format";
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import type { OcrStatus } from "../../../types/domain";

export interface DocumentItem {
  id: string;
  loadId: string | null;
  documentType: string;
  fileUrl: string;
  ocrStatus: OcrStatus;
  ocrConfidenceScore: number | null;
  uploadedAt: string;
}

export interface DocumentsTableProps {
  documents: DocumentItem[];
  loadsById: Record<string, string>;
  loadOptions: { value: string; label: string }[];
  signedUrlByPath: Record<string, string>;
  onUploadDocument?: () => void;
}

const OCR_BADGE_CONFIG: Record<
  OcrStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  completed: {
    label: "Extracted",
    className:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium px-2.5 py-0.5 rounded-full text-xs inline-flex items-center gap-1.5",
    icon: <CheckCircle2 className="h-3 w-3 text-emerald-600" />,
  },
  processing: {
    label: "Processing",
    className:
      "bg-blue-50 text-blue-700 border border-blue-200 font-medium px-2.5 py-0.5 rounded-full text-xs inline-flex items-center gap-1.5",
    icon: <Clock className="h-3 w-3 text-blue-600" />,
  },
  pending: {
    label: "Pending",
    className:
      "bg-slate-100 text-slate-700 border border-slate-200 font-medium px-2.5 py-0.5 rounded-full text-xs inline-flex items-center gap-1.5",
    icon: <Clock className="h-3 w-3 text-slate-500" />,
  },
  failed: {
    label: "OCR Failed",
    className:
      "bg-rose-50 text-rose-700 border border-rose-200 font-medium px-2.5 py-0.5 rounded-full text-xs inline-flex items-center gap-1.5",
    icon: <AlertTriangle className="h-3 w-3 text-rose-600" />,
  },
  review_required: {
    label: "Review Required",
    className:
      "bg-amber-50 text-amber-700 border border-amber-200 font-medium px-2.5 py-0.5 rounded-full text-xs inline-flex items-center gap-1.5",
    icon: <AlertTriangle className="h-3 w-3 text-amber-600" />,
  },
};

export function DocumentsTable({
  documents,
  loadsById,
  loadOptions,
  signedUrlByPath,
  onUploadDocument,
}: DocumentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleUploadDocument = onUploadDocument || (() => setIsUploadOpen(true));

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (statusFilter !== "ALL" && doc.ocrStatus !== statusFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const typeMatch = doc.documentType.toLowerCase().includes(q);
        const loadNum = doc.loadId ? (loadsById[doc.loadId] || doc.loadId).toLowerCase() : "";
        const fileMatch = (doc.fileUrl || "").toLowerCase().includes(q);
        if (!typeMatch && !loadNum.includes(q) && !fileMatch) {
          return false;
        }
      }

      return true;
    });
  }, [documents, loadsById, statusFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search documents by type, load, file..."
              aria-label="Search documents by type, filename, or load"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full pl-9 pr-3.5 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            />
          </div>

          <div className="w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full px-3 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            >
              <option value="ALL">All OCR Statuses</option>
              <option value="completed">Extracted</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="review_required">Review Required</option>
              <option value="failed">OCR Failed</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredDocuments.length} of {documents.length} documents
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents uploaded"
          description={
            searchTerm || statusFilter !== "ALL"
              ? "No document matches your search criteria or status filter. Try adjusting your search."
              : "Upload Rate Confirmations or Bills of Lading (BOL) to trigger automated OCR extraction."
          }
          action={{
            label: "Upload Document",
            onClick: handleUploadDocument,
          }}
        />
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <TableCell isHeader className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3.5 px-4">
                    Document Type
                  </TableCell>
                  <TableCell isHeader className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3.5 px-4">
                    Linked Load
                  </TableCell>
                  <TableCell isHeader className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3.5 px-4">
                    OCR Engine Status
                  </TableCell>
                  <TableCell isHeader className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3.5 px-4">
                    Confidence
                  </TableCell>
                  <TableCell isHeader className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3.5 px-4">
                    Upload Date
                  </TableCell>
                  <TableCell isHeader className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3.5 px-4 text-right">
                    File
                  </TableCell>
                </tr>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const ocrConfig = OCR_BADGE_CONFIG[doc.ocrStatus] || OCR_BADGE_CONFIG.pending;
                  const loadNum = doc.loadId ? loadsById[doc.loadId] || doc.loadId.slice(0, 8) : "—";
                  const signedFileUrl = signedUrlByPath[doc.fileUrl];

                  const normalizedScore =
                    doc.ocrConfidenceScore != null
                      ? doc.ocrConfidenceScore <= 1
                        ? Math.round(doc.ocrConfidenceScore * 100)
                        : Math.round(doc.ocrConfidenceScore)
                      : null;

                  return (
                    <TableRow key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Type */}
                      <TableCell className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex items-center gap-2.5 font-medium text-slate-900 text-sm">
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{doc.documentType}</span>
                        </div>
                      </TableCell>

                      {/* Load */}
                      <TableCell className="whitespace-nowrap px-4 py-3.5">
                        {doc.loadId ? (
                          <Link
                            href={`/loads/${doc.loadId}/documents`}
                            className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700 text-xs transition-colors"
                          >
                            <span>{loadNum}</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 italic text-xs">Unlinked</span>
                            <ManualLinkControl documentId={doc.id} loadOptions={loadOptions} />
                          </div>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="whitespace-nowrap px-4 py-3.5">
                        <span className={ocrConfig.className}>
                          {ocrConfig.icon}
                          <span>{ocrConfig.label}</span>
                        </span>
                      </TableCell>

                      {/* Confidence */}
                      <TableCell className="whitespace-nowrap px-4 py-3.5 text-xs font-mono">
                        {normalizedScore !== null ? (
                          <span
                            className={
                              normalizedScore >= 85
                                ? "font-semibold text-emerald-700"
                                : "font-medium text-slate-700"
                            }
                          >
                            {formatNullableNumber(normalizedScore, "%", "—")}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>

                      {/* Upload Date */}
                      <TableCell className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">
                        {formatDate(doc.uploadedAt)}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="whitespace-nowrap px-4 py-3.5 text-right">
                        {signedFileUrl ? (
                          <a
                            href={signedFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>View File</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">Stored</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Controlled Bulk Upload Modal for Empty State CTA */}
      <BulkPodUploadModal
        isOpen={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        trigger={null}
      />
    </div>
  );
}

export default DocumentsTable;
