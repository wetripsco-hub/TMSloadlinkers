"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Truck, Navigation, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateLoadDriverInfo } from "@/app/(dashboard)/loads/[id]/actions";
import { driverDispatchSchema, type DriverDispatchValues } from "@/lib/validations/load";
import { formatDateTime } from "@/lib/format";
import type { Load } from "../../../types/domain";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function driverDispatchDefaults(load: Load): DriverDispatchValues {
  return {
    driverName: load.driverName ?? "",
    driverPhone: load.driverPhone ?? "",
    truckNumber: load.truckNumber ?? "",
    trailerNumber: load.trailerNumber ?? "",
  };
}

export function DriverDispatchCard({ load }: { load: Load }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DriverDispatchValues>({
    resolver: zodResolver(driverDispatchSchema),
    defaultValues: driverDispatchDefaults(load),
  });

  function startEditing() {
    reset(driverDispatchDefaults(load));
    setError(null);
    setIsEditing(true);
  }

  async function onSubmit(values: DriverDispatchValues) {
    setError(null);
    setIsSaving(true);
    try {
      await updateLoadDriverInfo(load.id, values);
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save driver info");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Truck className="h-4 w-4 text-slate-400" />
          Assigned Driver & Telemetry
        </h3>
        <div className="flex items-center gap-2">
          <Link
            href={`/loads/${load.id}/tracking`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Navigation className="h-3.5 w-3.5" />
            Live Telemetry Portal
          </Link>
          {!isEditing && (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="driverName">Driver Name</Label>
              <Input id="driverName" placeholder="Jane Smith" {...register("driverName")} />
              <FieldError message={errors.driverName?.message} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="driverPhone">Driver Phone</Label>
              <Input id="driverPhone" placeholder="(555) 123-4567" {...register("driverPhone")} />
              <FieldError message={errors.driverPhone?.message} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="truckNumber">Truck Number</Label>
              <Input id="truckNumber" placeholder="T-104" {...register("truckNumber")} />
              <FieldError message={errors.truckNumber?.message} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="trailerNumber">Trailer Number</Label>
              <Input id="trailerNumber" placeholder="TR-2201" {...register("trailerNumber")} />
              <FieldError message={errors.trailerNumber?.message} />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
            <span className="text-slate-400 block mb-1">Driver Name</span>
            <span className="font-semibold text-slate-900 text-sm">
              {load.driverName || "Driver not assigned"}
            </span>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
            <span className="text-slate-400 block mb-1">Driver Phone</span>
            <span className="font-semibold text-slate-900 text-sm">
              {load.driverPhone || "—"}
            </span>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
            <span className="text-slate-400 block mb-1">Tractor / Trailer</span>
            <span className="font-semibold text-slate-900 text-sm">
              {load.truckNumber || "—"} / {load.trailerNumber || "—"}
            </span>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
            <span className="text-slate-400 block mb-1">Last GPS Ping</span>
            <span className="font-semibold text-slate-900 text-sm">
              {load.lastPingAt ? formatDateTime(load.lastPingAt) : "No ping recorded"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
