"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TailAdminButton } from "@/components/ui/tailadmin/form-elements";
import { InvoiceView } from "@/components/invoices/invoice-view";
import {
  Receipt,
  Printer,
  Download,
  ExternalLink,
} from "lucide-react";
import type { Invoice, Load, Organization } from "../../../types/domain";
import type { CustomerRecord } from "@/lib/repositories/customers";

export interface InvoiceModalProps {
  invoice: Invoice;
  load?: Load | null;
  customer?: CustomerRecord | null;
  organization?: Organization | null;
  triggerButton?: React.ReactNode;
}

export function InvoiceModal({
  invoice,
  load,
  customer,
  organization,
  triggerButton,
}: InvoiceModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const invNumber =
    invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {triggerButton ? (
        <span
          onClick={() => setIsOpen(true)}
          className="cursor-pointer inline-flex"
        >
          {triggerButton}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
          title="Print or Save PDF"
        >
          <Printer className="h-3.5 w-3.5 text-blue-600" />
          <span>Print / PDF</span>
        </button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[92vh] flex flex-col p-0 overflow-hidden bg-slate-900/90 backdrop-blur-md border border-slate-800 text-white">
          {/* Action Header in Modal (Hidden when printing) */}
          <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3.5 border-b border-slate-800 shrink-0 bg-slate-900/95 z-10 sticky top-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Freight Invoice</span>
                  <span className="font-mono text-blue-400 text-xs px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/60">
                    {invNumber}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Shipper Accounts Receivable & Remittance Advice
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 pr-12 sm:pr-14">
              <Link
                href={`/invoices/${invoice.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                title="Open full page view in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Full Page</span>
              </Link>
              <TailAdminButton
                variant="outline"
                size="sm"
                onClick={handlePrint}
                startIcon={<Printer className="h-4 w-4 text-slate-300" />}
                className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                Print / Save PDF
              </TailAdminButton>
              <TailAdminButton
                variant="primary"
                size="sm"
                onClick={handlePrint}
                startIcon={<Download className="h-4 w-4" />}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              >
                Export PDF
              </TailAdminButton>
            </div>
          </div>

          {/* Scrollable Document Viewport */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex justify-center bg-slate-950/40">
            <InvoiceView
              invoice={invoice}
              load={load}
              customer={customer}
              organization={organization}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default InvoiceModal;
