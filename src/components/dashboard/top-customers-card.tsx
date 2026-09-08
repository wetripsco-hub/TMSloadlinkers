"use client";

import React from "react";
import Link from "next/link";
import { formatMoney, formatNullableNumber } from "@/lib/format";

export interface TopCustomerItem {
  id: string;
  name: string;
  loadCount: number;
  revenueCents: number;
}

export interface TopCustomersCardProps {
  monthLabel?: string;
  customers: TopCustomerItem[];
}

export function TopCustomersCard({
  monthLabel = "March",
  customers = [],
}: TopCustomersCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm min-h-[180px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
          Top customers
        </h3>
        <span className="text-xs text-slate-400 font-medium">
          {monthLabel}
        </span>
      </div>

      {/* Body: List or Empty State */}
      <div className="flex-1 flex flex-col justify-center my-2">
        {customers.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">
            No matching records
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {customers.map((customer, index) => (
              <li
                key={customer.id}
                className="flex items-center justify-between py-2.5 text-xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-slate-100 text-[11px] font-bold text-slate-600">
                    {index + 1}
                  </span>
                  <Link
                    href={`/customers`}
                    className="truncate font-medium text-slate-800 hover:text-blue-600 transition-colors"
                  >
                    {customer.name}
                  </Link>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-400">
                    {formatNullableNumber(customer.loadCount)} load{customer.loadCount === 1 ? "" : "s"}
                  </span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {formatMoney(customer.revenueCents)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TopCustomersCard;
