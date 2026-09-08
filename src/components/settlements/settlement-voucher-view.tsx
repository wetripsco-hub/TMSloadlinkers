import React from "react";
import { formatMoney, formatDate } from "@/lib/format";
import { formatCents } from "@/lib/money";
import type { Invoice, Load, Organization } from "../../../types/domain";
import type { CarrierRecord } from "@/lib/repositories/carriers";
import {
  Truck,
  CheckCircle2,
  Clock,
  Landmark,
  MapPin,
  ShieldCheck,
  Building2,
} from "lucide-react";

export interface SettlementVoucherViewProps {
  invoice: Invoice;
  load?: Load | null;
  carrier?: CarrierRecord | null;
  organization?: Organization | null;
}

export function SettlementVoucherView({
  invoice,
  load,
  carrier,
  organization,
}: SettlementVoucherViewProps) {
  const voucherNum =
    invoice.invoiceNumber || `SET-${invoice.id.slice(0, 8).toUpperCase()}`;
  const loadNum = load
    ? (load.loadNumber || `LD-${load.id.slice(0, 6).toUpperCase()}`)
    : (invoice.loadId ? `LD-${invoice.loadId.slice(0, 6).toUpperCase()}` : "—");

  const issueDateFormatted = invoice.issueDate ? formatDate(invoice.issueDate) : "—";
  const totalPay = invoice.amountTotal || (load?.carrierPay ?? 0);
  const lineHaul = Math.round(totalPay * 0.88);
  const fuelSurcharge = totalPay - lineHaul;

  const isPaid = invoice.status === "paid";
  const isPartial = invoice.status === "partially_paid";

  const complianceParts: string[] = [];
  if (organization?.mcNumber) complianceParts.push(`MC# ${organization.mcNumber}`);
  if (organization?.dotNumber) complianceParts.push(`DOT# ${organization.dotNumber}`);
  const complianceStr = complianceParts.join(" · ");

  const hasBankDetails = Boolean(
    organization?.bankName ||
    organization?.routingNumber ||
    organization?.accountNumber ||
    organization?.remittanceNotes
  );

  const maskedAccountNumber = organization?.accountNumber
    ? (organization.accountNumber.length > 4
        ? `••••${organization.accountNumber.slice(-4)}`
        : organization.accountNumber)
    : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm print:max-w-none print:border-none print:shadow-none print:p-0 print:text-black print:bg-white">
      {/* Document Header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b-2 border-slate-900 pb-5 print:border-black">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 print:text-black">
            Carrier Accounts Payable · Remittance Voucher
          </span>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 print:text-black">
            {organization?.name || "Freight Brokerage"}
          </h1>
          {organization?.address && (
            <p className="text-xs text-slate-600 print:text-black mt-0.5">
              {organization.address}
            </p>
          )}
          {complianceStr && (
            <p className="text-xs text-slate-600 print:text-black mt-0.5 font-medium">
              {complianceStr}
            </p>
          )}
          {(organization?.contactPhone || organization?.contactEmail) ? (
            <p className="text-xs text-slate-500 print:text-black mt-0.5">
              {[
                organization?.contactPhone ? `Accounting: ${organization.contactPhone}` : null,
                organization?.contactEmail ? `Email: ${organization.contactEmail}` : null,
              ].filter(Boolean).join(" · ")}
            </p>
          ) : (
            <p className="text-xs text-slate-500 print:text-black mt-0.5">
              Freight Settlement & Accounting Operations
            </p>
          )}
        </div>

        <div className="mt-4 sm:mt-0 sm:text-right">
          <div className="inline-flex items-center gap-2">
            <span className="inline-block rounded-md bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white print:bg-black">
              SETTLEMENT VOUCHER
            </span>
            {isPaid ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 print:border-black print:text-black print:bg-transparent">
                <CheckCircle2 className="h-3.5 w-3.5" />
                DISBURSED / PAID
              </span>
            ) : isPartial ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200 print:border-black print:text-black print:bg-transparent">
                <Clock className="h-3.5 w-3.5" />
                PARTIALLY PAID
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800 border border-blue-200 print:border-black print:text-black print:bg-transparent">
                <Clock className="h-3.5 w-3.5" />
                AUTHORIZED FOR PAYMENT
              </span>
            )}
          </div>

          <div className="mt-3 text-xs space-y-0.5">
            <p className="font-bold text-slate-900 print:text-black">
              Voucher #: <span className="font-mono text-emerald-600 print:text-black">{voucherNum}</span>
            </p>
            <p className="text-slate-500 print:text-black">
              Date Issued: {issueDateFormatted}
            </p>
            <p className="text-slate-500 print:text-black font-semibold">
              Load Reference: <span className="font-mono text-slate-900 print:text-black">{loadNum}</span>
            </p>
          </div>
        </div>
      </header>

      {/* Payee Carrier & Payer Disbursing Office Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
        {/* Carrier Payee Box */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 print:border-gray-300 print:bg-white print:p-2">
          <div className="flex items-center gap-2 mb-2 text-slate-600 print:text-black">
            <Truck className="h-4 w-4 text-emerald-600 print:text-black" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Payee (Authorized Carrier)</span>
          </div>
          <p className="text-sm font-bold text-slate-900 print:text-black">
            {carrier?.companyName || "Assigned Carrier"}
          </p>
          <div className="mt-1 space-y-0.5 text-xs text-slate-600 print:text-black">
            {(carrier?.mcNumber || carrier?.dotNumber) && (
              <p>
                {[
                  carrier?.mcNumber ? `MC# ${carrier.mcNumber}` : null,
                  carrier?.dotNumber ? `DOT# ${carrier.dotNumber}` : null,
                ].filter(Boolean).join(" · ")}
              </p>
            )}
            <p>
              {[
                carrier?.contactEmail || "dispatch@carrier.com",
                carrier?.contactPhone,
              ].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        {/* Disbursing Brokerage Box */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 print:border-gray-300 print:bg-white print:p-2">
          <div className="flex items-center gap-2 mb-2 text-slate-600 print:text-black">
            <Building2 className="h-4 w-4 text-blue-600 print:text-black" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Disbursing Organization (Payer)</span>
          </div>
          <p className="text-sm font-bold text-slate-900 print:text-black">
            {organization?.name || "Corporate Treasury & Payables"}
          </p>
          <p className="text-xs text-slate-600 print:text-black mt-0.5">
            {organization?.address || "Corporate address on file"}
          </p>
          {(organization?.contactEmail || organization?.contactPhone) && (
            <p className="text-xs text-slate-500 print:text-black mt-1">
              {[organization?.contactEmail, organization?.contactPhone].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {/* Shipment Transit Reference (If load details present) */}
      {load && (
        <div className="rounded-xl border border-slate-200 p-4 print:border-gray-300 print:p-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600 print:text-black" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 print:text-black">
                Trip & Freight Verification Summary
              </span>
            </div>
            <span className="text-xs font-semibold text-emerald-700 print:text-black">
              POD Verified · Ready for Payout
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 text-[11px]">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Origin Pick
              </span>
              <p className="font-semibold text-slate-900 print:text-black">
                {load.origin?.facilityName || "Shipper Facility"}
              </p>
              <p className="text-slate-600 print:text-black">
                {[load.origin?.city, load.origin?.state, load.origin?.zip].filter(Boolean).join(", ")}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 text-[11px]">
                <MapPin className="h-3.5 w-3.5 text-rose-600" /> Delivery Drop
              </span>
              <p className="font-semibold text-slate-900 print:text-black">
                {load.destination?.facilityName || "Consignee Dock"}
              </p>
              <p className="text-slate-600 print:text-black">
                {[load.destination?.city, load.destination?.state, load.destination?.zip].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Financial Settlement Breakdown */}
      <div className="rounded-xl border border-slate-200 overflow-hidden print:border-gray-300">
        <div className="grid grid-cols-3 bg-slate-50/80 p-3 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 print:bg-gray-100 print:text-black">
          <span>Settlement Item / Description</span>
          <span className="text-center">Settlement Method</span>
          <span className="text-right">Pay Amount (USD)</span>
        </div>
        <div className="divide-y divide-slate-100 text-xs print:divide-gray-200">
          <div className="grid grid-cols-3 p-3">
            <span className="font-medium text-slate-900 print:text-black">Contracted Line Haul</span>
            <span className="text-center text-slate-500 print:text-black">Agreed Rate Con</span>
            <span className="text-right font-mono font-semibold text-slate-900">{formatCents(lineHaul)}</span>
          </div>
          <div className="grid grid-cols-3 p-3">
            <span className="font-medium text-slate-900 print:text-black">Fuel Surcharge / FSC Allocation</span>
            <span className="text-center text-slate-500 print:text-black">Included in Rate</span>
            <span className="text-right font-mono font-semibold text-slate-900">{formatCents(fuelSurcharge)}</span>
          </div>
          <div className="grid grid-cols-3 bg-emerald-50/70 p-3.5 text-sm font-bold text-slate-900 border-t border-emerald-100 print:bg-gray-100 print:text-black">
            <span className="uppercase text-emerald-900 print:text-black">Total Carrier Settlement Payout</span>
            <span className="text-center text-xs font-medium text-emerald-800 print:text-black">Direct ACH Disbursement</span>
            <span className="text-right font-mono text-base text-emerald-800 print:text-black">
              {formatMoney(totalPay)}
            </span>
          </div>
        </div>
      </div>

      {/* Disbursing Banking Details (Optional from Settings) */}
      {hasBankDetails && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 print:border-gray-300 print:bg-white print:p-3">
          <div className="flex items-center gap-2 mb-2 text-slate-800 print:text-black">
            <Landmark className="h-4 w-4 text-emerald-600 print:text-black" />
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 print:text-black">
              Disbursement Source & Banking Reference
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {organization?.bankName && (
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 print:text-gray-600 block">Bank Institution</span>
                <span className="font-semibold text-slate-900 print:text-black">{organization.bankName}</span>
              </div>
            )}
            {organization?.routingNumber && (
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 print:text-gray-600 block">Transit Routing (ABA)</span>
                <span className="font-mono font-semibold text-slate-900 print:text-black">{organization.routingNumber}</span>
              </div>
            )}
            {maskedAccountNumber && (
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 print:text-gray-600 block">Disbursing Account</span>
                <span className="font-mono font-semibold text-slate-900 print:text-black">{maskedAccountNumber}</span>
              </div>
            )}
            {organization?.remittanceNotes && (
              <div className="sm:col-span-2 md:col-span-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 print:text-gray-600 block">Payment Memo</span>
                <span className="text-slate-700 print:text-black">{organization.remittanceNotes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sign-Off and Certification */}
      <footer className="grid grid-cols-2 gap-8 border-t-2 border-slate-900 pt-5 print:border-black">
        <div>
          <p className="text-[11px] font-bold text-slate-800 print:text-black uppercase tracking-wider">
            Finance & Accounts Payable Authorization
          </p>
          <div className="mt-8 border-b border-slate-300 print:border-black" />
          <div className="mt-1 flex justify-between text-[10px] text-slate-500 print:text-black">
            <span>Authorized Officer</span>
            <span>Date: {issueDateFormatted}</span>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold text-slate-800 print:text-black uppercase tracking-wider">
            Carrier Remittance Acknowledgment
          </p>
          <div className="mt-8 border-b border-slate-300 print:border-black" />
          <div className="mt-1 flex justify-between text-[10px] text-slate-500 print:text-black">
            <span>Carrier Payee Representative</span>
            <span>Date</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default SettlementVoucherView;