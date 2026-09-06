import { notFound } from "next/navigation";
import Link from "next/link";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { DocumentList } from "@/components/documents/document-list";
import { PageHeader } from "@/components/layout/page-header";
import { getLoadById } from "@/lib/repositories/loads";
import { listDocumentsByLoadId } from "@/lib/repositories/documents";
import { UploadCloud, ArrowLeft } from "lucide-react";

export default async function LoadDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const load = await getLoadById(id);

  if (!load) {
    notFound();
  }

  const documents = await listDocumentsByLoadId(load.id);
  const loadLabel = load.loadNumber || `LD-${load.id.slice(0, 6).toUpperCase()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Documents · ${loadLabel}`}
        subtitle="Upload and inspect BOLs, rate confirmations, PODs, and OCR extractions."
        breadcrumbs={[
          { label: "Operations", href: "/overview" },
          { label: "Loads", href: "/loads" },
          { label: loadLabel, href: `/loads/${load.id}` },
          { label: "Documents" },
        ]}
        action={
          <Link
            href={`/loads/${load.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Load
          </Link>
        }
      />

      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-4 border-b border-slate-100 pb-3">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <UploadCloud className="h-4 w-4 text-slate-400" />
            Upload New Load Document
          </h2>
        </div>
        <DocumentUploadForm loadId={load.id} />
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Attached Documentation & OCR Records ({documents.length})
        </h2>
        <DocumentList documents={documents} />
      </div>
    </div>
  );
}
