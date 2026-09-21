import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { listSortedQuotesForOrg } from "@/lib/repositories/quotes";
import { QuotesList } from "@/components/loads/quotes-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quotes | FreightLink TMS",
};

export default async function QuotesPage() {
  const quotes = await listSortedQuotesForOrg();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        subtitle="Every quote sent to a shipper, across every load, with the ones needing your response pinned to the top."
        breadcrumbs={[{ label: "Quotes" }]}
      />

      <QuotesList initialQuotes={quotes} />
    </div>
  );
}
