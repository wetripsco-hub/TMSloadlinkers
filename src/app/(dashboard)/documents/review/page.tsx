import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { listDocumentsForReview } from "@/lib/repositories/documents";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ReviewQueueList } from "@/components/documents/review-queue-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Document Review Queue | FreightLink TMS",
};

export default async function DocumentReviewPage() {
  const documents = await listDocumentsForReview();

  // Same server-side batch signed-URL pattern as
  // app/(dashboard)/documents/page.tsx -- one createSignedUrls() call for
  // every listed document's private-bucket path, rather than a client-side
  // fetch per row.
  const supabase = await createClient();
  const paths = documents.map((d) => d.fileUrl).filter(Boolean);

  const signedUrlByPath: Record<string, string> = {};
  if (paths.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from("load-documents")
      .createSignedUrls(paths, 3600); // 1 hour expiry

    (signedUrls ?? []).forEach((entry) => {
      if (entry.path && entry.signedUrl) {
        signedUrlByPath[entry.path] = entry.signedUrl;
      }
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Review Queue"
        subtitle="Verify or correct low-confidence OCR extractions before they're marked complete."
        breadcrumbs={[
          { label: "Operations", href: "/overview" },
          { label: "Documents", href: "/documents" },
          { label: "Review Queue" },
        ]}
      />

      {documents.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nothing needs review"
          description="Every document's OCR extraction is either still processing or already confirmed."
        />
      ) : (
        <ReviewQueueList documents={documents} signedUrlByPath={signedUrlByPath} />
      )}
    </div>
  );
}
