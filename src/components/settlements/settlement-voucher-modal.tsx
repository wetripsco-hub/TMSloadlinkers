"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TailAdminButton } from "@/components/ui/tailadmin/form-elements";
import { SettlementVoucherView } from "@/components/settlements/settlement-voucher-view";
import { Landmark, Printer, Download } from "lucide-react";
import type { Invoice, Load, Organization } from "../../../types/domain";
import type { CarrierRecord } from "@/lib/repositories/carriers";

export interface SettlementVoucherModalProps {
  invoice: Invoice;
  load?: Load | null;
  carrier?: CarrierRecord | null;
  organization?: Organization | null;
  triggerButton?: React.ReactNode;
}

export function SettlementVoucherModal({
  invoice,
  load,
  carrier,
  organization,
  triggerButton,
}: SettlementVoucherModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const voucherNum =
    invoice.invoiceNumber || `SET-${invoice.id.slice(0, 8).toUpperCase()}`;

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
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
          title="Print or Save PDF"
        >
          <Printer className="h-3.5 w-3.5 text-emerald-600" />
          <span>Voucher / PDF</span>
        </button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[92vh] flex flex-col p-0 overflow-hidden bg-slate-900/90 backdrop-blur-md border border-slate-800 text-white">
          {/* Action Header in Modal (Hidden when printing) */}
          <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3.5 border-b border-slate-800 shrink-0 bg-slate-900/95 z-10 sticky top-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Carrier Settlement Voucher</span>
                  <span className="font-mono text-emerald-400 text-xs px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                    {voucherNum}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Carrier Remittance Advice & Official Payout Voucher
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 pr-12 sm:pr-14">
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
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Export PDF
              </TailAdminButton>
            </div>
          </div>

          {/* Scrollable Document Viewport */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex justify-center bg-slate-950/40">
            <SettlementVoucherView
              invoice={invoice}
              load={load}
              carrier={carrier}
              organization={organization}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SettlementVoucherModal;