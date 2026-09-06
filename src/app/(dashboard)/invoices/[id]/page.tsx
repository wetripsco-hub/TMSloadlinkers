import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { InvoiceView } from "@/components/invoices/invoice-view";
import { PrintButton } from "@/components/documents/print-button";
import { PageHeader } from "@/components/layout/page-header";
import { getInvoiceById } from "@/lib/repositories/invoices";
import { getLoadById } from "@/lib/repositories/loads";
import { getCustomerById } from "@/lib/repositories/customers";
import { getOrganizationById } from "@/lib/repositories/organizations";
import { ArrowLeft, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  const invNumber =
    invoice?.invoiceNumber ||
    (invoice ? `INV-${invoice.id.slice(0, 8).toUpperCase()}` : "Invoice");
  return {
    title: `${invNumber} · Print & Remittance | FreightLink TMS`,
    description: `Freight invoice and remittance details for ${invNumber}`,
  };
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  const [load, organization] = await Promise.all([
    invoice.loadId ? getLoadById(invoice.loadId) : Promise.resolve(null),
    getOrganizationById(invoice.orgId),
  ]);

  const customerId = invoice.customerId || (load?.customerId ?? null);
  const customer = customerId ? await getCustomerById(customerId) : null;

  const invNumber =
    invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8).toUpperCase()}`;
  const loadNum = load
    ? load.loadNumber || `LD-${load.id.slice(0, 6).toUpperCase()}`
    : null;

  return (
    <div className="space-y-6">
      {/* Top Header Controls (Hidden during print / PDF export) */}
      <div className="no-print">
        <PageHeader
          title={`Freight Invoice · ${invNumber}`}
          subtitle="Official billing document, shipping breakdown, and payment remittance."
          breadcrumbs={[
            { label: "Financials", href: "/invoices" },
            { label: "Invoices", href: "/invoices" },
            { label: invNumber },
          ]}
          action={
            <div className="flex items-center gap-2">
              <Link
                href="/invoices"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Invoices</span>
              </Link>
              {load && (
                <Link
                  href={`/loads/${load.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
                >
                  <Truck className="h-3.5 w-3.5 text-blue-600" />
                  <span>View Load #{loadNum}</span>
                </Link>
              )}
              <PrintButton />
            </div>
          }
        />
      </div>

      {/* Full Document View */}
      <div className="pb-12">
        <InvoiceView
          invoice={invoice}
          load={load}
          customer={customer}
          organization={organization}
        />
      </div>
    </div>
  );
}
