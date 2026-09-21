"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Warehouse, CalendarClock, Pencil, Trash2 } from "lucide-react";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/tailadmin/table";
import { EmptyState } from "@/components/ui/empty-state";
import { FacilityFormDialog } from "@/components/facilities/facility-form-dialog";
import { deleteFacilityAction } from "@/app/(dashboard)/facilities/actions";
import type { Facility } from "../../../types/domain";
import type { CustomerRecord } from "@/lib/repositories/customers";

const SHARED_FILTER_VALUE = "__shared__";

export interface FacilityTableProps {
  facilities: Facility[];
  customers: CustomerRecord[];
}

export function FacilityTable({ facilities, customers }: FacilityTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("ALL");
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const customerNameById = useMemo(() => new Map(customers.map((c) => [c.id, c.name])), [customers]);

  const filteredFacilities = useMemo(() => {
    return facilities.filter((facility) => {
      if (customerFilter === SHARED_FILTER_VALUE && facility.customerId !== null) {
        return false;
      }
      if (
        customerFilter !== "ALL" &&
        customerFilter !== SHARED_FILTER_VALUE &&
        facility.customerId !== customerFilter
      ) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = facility.name.toLowerCase().includes(q);
        const matchesCity = facility.city.toLowerCase().includes(q);
        const matchesState = facility.state.toLowerCase().includes(q);
        if (!matchesName && !matchesCity && !matchesState) {
          return false;
        }
      }

      return true;
    });
  }, [facilities, customerFilter, searchTerm]);

  async function handleDelete(facility: Facility) {
    if (!window.confirm(`Delete "${facility.name}"? This can't be undone.`)) {
      return;
    }

    setDeleteError(null);
    setDeletingId(facility.id);
    try {
      await deleteFacilityAction(facility.id);
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete facility");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {deleteError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
          {deleteError}
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search by name, city, or state..."
              aria-label="Search facilities by name, city, or state"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full pl-9 pr-3.5 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            />
          </div>

          <div className="w-52">
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              aria-label="Filter facilities by customer"
              className="h-10 w-full px-3 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            >
              <option value="ALL">All Facilities</option>
              <option value={SHARED_FILTER_VALUE}>Shared (no customer)</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredFacilities.length} of {facilities.length} facilities
        </div>
      </div>

      {filteredFacilities.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title="No facilities found"
          description={
            searchTerm || customerFilter !== "ALL"
              ? "No facility matches your search or filter. Try adjusting your criteria."
              : "Save a shipping/receiving dock so it can be reused when creating loads."
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <tr className="border-y border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider py-3.5 px-4">
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Facility</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">City / State</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Customer</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600">Appointment</TableCell>
              <TableCell isHeader className="py-3.5 px-4 text-slate-600 text-right">Actions</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredFacilities.map((facility) => (
              <TableRow key={facility.id} className="hover:bg-slate-50/70 transition-colors">
                <TableCell className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Warehouse className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{facility.name}</p>
                      {facility.address && <p className="text-xs text-slate-500">{facility.address}</p>}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-3.5 px-4 text-sm text-slate-700">
                  {facility.city}, {facility.state}
                </TableCell>

                <TableCell className="py-3.5 px-4">
                  {facility.customerId ? (
                    <span className="text-sm text-slate-800">
                      {customerNameById.get(facility.customerId) ?? "Unknown customer"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      Shared
                    </span>
                  )}
                </TableCell>

                <TableCell className="py-3.5 px-4">
                  {facility.appointmentRequired ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      <CalendarClock className="h-3 w-3" />
                      Required
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Not required</span>
                  )}
                </TableCell>

                <TableCell className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingFacility(facility)}
                      aria-label={`Edit ${facility.name}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:underline"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(facility)}
                      disabled={deletingId === facility.id}
                      aria-label={`Delete ${facility.name}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-800 transition-colors focus:outline-none focus:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deletingId === facility.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Single shared edit dialog, driven by editingFacility -- open state
          is `!!editingFacility` rather than a separate boolean, so there's
          no window where the dialog is open with a stale/no facility. */}
      <FacilityFormDialog
        customers={customers}
        facility={editingFacility ?? undefined}
        open={!!editingFacility}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditingFacility(null);
        }}
        trigger={null}
        onSuccess={() => {
          setEditingFacility(null);
          router.refresh();
        }}
      />
    </div>
  );
}
