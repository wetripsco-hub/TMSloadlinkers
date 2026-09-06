import { FileDown, Sheet } from "lucide-react";

export type ExportReportType =
  | "financial-summary"
  | "carrier-performance"
  | "load-volume"
  | "top-customers";

export interface ExportButtonsProps {
  reportType: ExportReportType;
  startDate: string;
  endDate: string;
  bucket?: "week" | "month";
}

// Plain anchors, not client-side fetch-and-blob: /api/pdf/reports and
// /api/csv/reports already stream a proper Content-Disposition response, so
// a normal browser navigation is all a download needs.
export function ExportButtons({ reportType, startDate, endDate, bucket }: ExportButtonsProps) {
  const params = new URLSearchParams({ reportType, startDate, endDate });
  if (bucket) {
    params.set("bucket", bucket);
  }
  const query = params.toString();

  return (
    <div className="flex items-center gap-2">
      <a
        href={`/api/pdf/reports?${query}`}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        <FileDown className="size-3.5" />
        Export PDF
      </a>
      <a
        href={`/api/csv/reports?${query}`}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        <Sheet className="size-3.5" />
        Export CSV
      </a>
    </div>
  );
}
