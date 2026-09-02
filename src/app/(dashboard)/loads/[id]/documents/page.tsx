import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { DocumentList } from "@/components/documents/document-list";
import { getLoadById } from "@/lib/repositories/loads";
import { listDocumentsByLoadId } from "@/lib/repositories/documents";

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

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-lg font-medium">
          Documents · {load.loadNumber || load.id.slice(0, 8)}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload document</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentUploadForm loadId={load.id} />
        </CardContent>
      </Card>

      <DocumentList documents={documents} />
    </div>
  );
}
