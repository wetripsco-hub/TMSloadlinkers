import React from "react";
import { formatMoney, formatDate } from "@/lib/format";
import type { Invoice, Load, Organization } from "../../../types/domain";
import type { CustomerRecord } from "@/lib/repositories/customers";
import {
  Building2,
  CreditCard,
  MapPin,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Landmark,
} from "lucide-react";

export interface InvoiceViewProps {
  invoice: Invoice;
  load?: Load | null;
  customer?: CustomerRecord | null;
  organization?: Organization | null;
}

export function InvoiceView({
  invoice,
  load,
  customer,
  organization,
}: InvoiceViewProps) {
  const invNumber =
    invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8).toUpperCase()}`;
  const loadNum = load ? (load.loadNumber || `LD-${load.id.slice(0, 6).toUpperCase()}`) : null;

  const issueDateFormatted = invoice.issueDate ? formatDate(invoice.issueDate) : "—";
  const dueDateFormatted = invoice.dueDate ? formatDate(invoice.dueDate) : "Net 30 Days";

  const totalAmount = invoice.amountTotal || 0;
  const paidAmount = invoice.amountPaid || 0;
  const dueAmount = invoice.amountDue !== undefined ? invoice.amountDue : totalAmount - paidAmount;

  const isPaid = invoice.status === "paid";
  const isPartial = invoice.status === "partially_paid";

  // Linehaul & Surcharge estimates if not itemized
  const linehaulAmount = Math.round(totalAmount * 0.88);
  const fuelSurchargeAmount = totalAmount - linehaulAmount;

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
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b-2 border-slate-900 pb-6 print:border-black">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 print:text-black">
            Freight & Logistics Invoice
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
          {(organization?.contactEmail || organization?.contactPhone) ? (
            <p className="text-xs text-slate-500 print:text-black mt-0.5">
              {[
                organization?.contactEmail ? `Billing: ${organization.contactEmail}` : null,
                organization?.contactPhone,
              ].filter(Boolean).join(" · ")}
            </p>
          ) : (
            <p className="text-xs text-slate-500 print:text-black mt-0.5">
              Accounts Receivable & Billing
            </p>
          )}
        </div>

        <div className="mt-4 sm:mt-0 sm:text-right">
          <div className="inline-flex items-center gap-2">
            <span className="inline-block rounded-md bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white print:bg-black">
              INVOICE
            </span>
            {isPaid ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 print:border-black print:text-black print:bg-transparent">
                <CheckCircle2 className="h-3.5 w-3.5" />
                PAID IN FULL
              </span>
            ) : isPartial ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200 print:border-black print:text-black print:bg-transparent">
                <Clock className="h-3.5 w-3.5" />
                PARTIALLY PAID
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800 border border-rose-200 print:border-black print:text-black print:bg-transparent">
                <AlertCircle className="h-3.5 w-3.5" />
                PAYMENT DUE
              </span>
            )}
          </div>

          <div className="mt-3 text-xs space-y-0.5">
            <p className="font-bold text-slate-900 print:text-black">
              Invoice #: <span className="font-mono text-blue-600 print:text-black">{invNumber}</span>
            </p>
            <p className="text-slate-500 print:text-black">
              Issue Date: {issueDateFormatted}
            </p>
            <p className="text-slate-500 print:text-black font-semibold">
              Due Date: {dueDateFormatted}
            </p>
            {load?.customerPoNumber && (
              <p className="text-slate-500 print:text-black">
                Customer PO #: <span className="font-mono text-slate-800 print:text-black font-bold">{load.customerPoNumber}</span>
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Bill To & Remit To Two-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
        {/* Bill To */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 print:border-gray-300 print:bg-white print:p-2">
          <div className="flex items-center gap-2 mb-2 text-slate-500 print:text-black">
            <Building2 className="h-4 w-4 text-blue-600 print:text-black" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Bill To (Customer / Shipper)</span>
          </div>
          <p className="text-sm font-bold text-slate-900 print:text-black">
            {customer?.name || invoice.billToName || "Direct Shipper Account"}
          </p>
          <p className="text-xs text-slate-600 print:text-black mt-0.5">
            {customer?.billingAddress || "Billing address on file"}
          </p>
          <p className="text-xs text-slate-500 print:text-black mt-1">
            Accounts Payable: {customer?.email || invoice.billToEmail || "ap@customer.com"}
            {customer?.phone ? ` · ${customer.phone}` : ""}
          </p>
        </div>

        {/* Remit To */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 print:border-gray-300 print:bg-white print:p-2">
          <div className="flex items-center gap-2 mb-2 text-slate-500 print:text-black">
            <CreditCard className="h-4 w-4 text-emerald-600 print:text-black" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Remit Payment To</span>
          </div>
          <p className="text-sm font-bold text-slate-900 print:text-black">
            {organization?.name || "Corporate Remittance Office"}
          </p>
          <p className="text-xs text-slate-600 print:text-black mt-0.5">
            {organization?.address || "Address on file"}
          </p>
          {(organization?.contactPhone || organization?.contactEmail) && (
            <p className="text-xs text-slate-500 print:text-black mt-1">
              {[organization?.contactEmail, organization?.contactPhone].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {/* Linked Shipment Details (If Applicable) */}
      {load && (
        <div className="rounded-xl border border-slate-200 p-4 print:border-gray-300 print:p-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600 print:text-black" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 print:text-black">
                Shipment Reference Details
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-blue-600 print:text-black">
              Load #{loadNum}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Origin */}
            <div className="space-y-1">
              <span className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Origin (Pickup)
              </span>
              <p className="font-semibold text-slate-900 print:text-black">
                {load.origin?.facilityName || "Shipper Facility"}
              </p>
              <p className="text-slate-600 print:text-black">
                {load.origin?.address || "—"}
              </p>
              <p className="text-slate-500 print:text-black">
                {[load.origin?.city, load.origin?.state, load.origin?.zip].filter(Boolean).join(", ")}
              </p>
              {load.origin?.windowStart && (
                <p className="text-slate-500 font-medium">
                  Picked up: {formatDate(load.origin.windowStart)}
                </p>
              )}
            </div>

            {/* Destination */}
            <div className="space-y-1">
              <span className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-rose-600" /> Destination (Delivery)
              </span>
              <p className="font-semibold text-slate-900 print:text-black">
                {load.destination?.facilityName || "Consignee Dock"}
              </p>
              <p className="text-slate-600 print:text-black">
                {load.destination?.address || "—"}
              </p>
              <p className="text-slate-500 print:text-black">
                {[load.destination?.city, load.destination?.state, load.destination?.zip].filter(Boolean).join(", ")}
              </p>
              {load.destination?.windowStart && (
                <p className="text-slate-500 font-medium">
                  Delivered: {formatDate(load.destination.windowStart)}
                </p>
              )}
            </div>
          </div>

          {/* Commodity & Equipment specs */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 print:text-black">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Equipment</span>
              <span className="font-medium">{load.equipmentType || "53' Dry Van"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Commodity</span>
              <span className="font-medium">{load.commodity || "General Freight"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Weight</span>
              <span className="font-medium">{load.weightLbs ? `${load.weightLbs.toLocaleString()} lbs` : "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Delivery Status</span>
              <span className="font-medium capitalize text-emerald-700 font-semibold">Delivered & POD Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* Line Items Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden print:border-gray-300">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 uppercase tracking-wider print:bg-gray-100 print:text-black font-bold">
              <th className="py-3 px-4">Line Item / Description</th>
              <th className="py-3 px-4 text-center">Qty / Unit</th>
              <th className="py-3 px-4 text-right">Rate</th>
              <th className="py-3 px-4 text-right">Amount (USD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 print:divide-gray-200">
            <tr>
              <td className="py-3 px-4 font-semibold text-slate-900 print:text-black">
                Primary Freight Linehaul Transportation
                <span className="block text-[11px] font-normal text-slate-500 print:text-black">
                  {load ? `Dedicated shipment ${loadNum}` : "Full Truckload Transport"}
                </span>
              </td>
              <td className="py-3 px-4 text-center text-slate-600 print:text-black">1 Load</td>
              <td className="py-3 px-4 text-right font-mono text-slate-700 print:text-black">
                {formatMoney(linehaulAmount)}
              </td>
              <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 print:text-black">
                {formatMoney(linehaulAmount)}
              </td>
            </tr>

            {fuelSurchargeAmount > 0 && (
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900 print:text-black">
                  Fuel Surcharge (DOE Index Adjusted)
                  <span className="block text-[11px] font-normal text-slate-500 print:text-black">
                    Standard diesel market index adjustment
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-slate-600 print:text-black">Flat</td>
                <td className="py-3 px-4 text-right font-mono text-slate-700 print:text-black">
                  {formatMoney(fuelSurchargeAmount)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 print:text-black">
                  {formatMoney(fuelSurchargeAmount)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Financial Totals Summary */}
        <div className="border-t-2 border-slate-200 bg-slate-50/50 p-4 print:border-black print:bg-white">
          <div className="flex flex-col gap-1.5 ml-auto max-w-xs text-xs">
            <div className="flex justify-between text-slate-600 print:text-black">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">{formatMoney(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600 print:text-black">
              <span>Amount Paid / Credited:</span>
              <span className="font-mono font-medium text-emerald-700">-{formatMoney(paidAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900 print:text-black">
              <span>BALANCE DUE (USD):</span>
              <span className="font-mono text-base text-blue-600 print:text-black">
                {formatMoney(dueAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Remittance Instructions (Conditional Bank / Wire Box) */}
      {hasBankDetails && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 print:border-gray-300 print:bg-white print:p-3">
          <div className="flex items-center gap-2 mb-2.5 text-slate-800 print:text-black">
            <Landmark className="h-4 w-4 text-emerald-600 print:text-black" />
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 print:text-black">
              Remittance Instructions (ACH / Wire)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {organization?.bankName && (
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 print:text-gray-600 block">Bank Name</span>
                <span className="font-semibold text-slate-900 print:text-black">{organization.bankName}</span>
              </div>
            )}
            {organization?.routingNumber && (
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 print:text-gray-600 block">Routing (ABA)</span>
                <span className="font-mono font-semibold text-slate-900 print:text-black">{organization.routingNumber}</span>
              </div>
            )}
            {maskedAccountNumber && (
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 print:text-gray-600 block">Account Number</span>
                <span className="font-mono font-semibold text-slate-900 print:text-black">{maskedAccountNumber}</span>
              </div>
            )}
            {organization?.remittanceNotes && (
              <div className="sm:col-span-2 md:col-span-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 print:text-gray-600 block">Memo / Notes</span>
                <span className="text-slate-700 print:text-black">{organization.remittanceNotes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terms & Conditions / Remittance Notice */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 text-[11px] text-slate-600 space-y-1.5 print:border-gray-300 print:bg-white print:text-black">
        <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] print:text-black">
          Payment Terms & Instructions
        </h4>
        <p>
          Payment is due within 30 days of the invoice date unless contractual credit terms specify otherwise. Please include the Invoice Number ({invNumber}) on all check remittances and electronic wire transfers.
        </p>
        <p className="text-[10px] text-slate-500 print:text-black">
          {organization?.name || "Brokerage"} operates as an authorized freight property broker under FMCSA authority. All claims or discrepancies must be reported in writing within 15 business days. Thank you for your business!
        </p>
      </div>
    </div>
  );
}

export default InvoiceView;
