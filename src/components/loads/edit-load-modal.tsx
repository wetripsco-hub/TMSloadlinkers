"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/tailadmin/modal";
import {
  TailAdminInput,
  TailAdminSelect,
  TailAdminLabel,
  TailAdminButton,
} from "@/components/ui/tailadmin/form-elements";
import { updateLoadDetails } from "@/app/(dashboard)/loads/[id]/actions";
import { DollarSign, MapPin, Calendar, Truck, User } from "lucide-react";
import type { Load } from "../../../types/domain";
import type { CustomerRecord } from "@/lib/repositories/customers";

export interface EditLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  load: Load;
  customers: CustomerRecord[];
}

const EQUIPMENT_OPTIONS = [
  { value: "53' Dry Van", label: "53' Dry Van" },
  { value: "53' Reefer (Refrigerated)", label: "53' Reefer (Refrigerated)" },
  { value: "Flatbed 48'", label: "Flatbed 48'" },
  { value: "Step Deck", label: "Step Deck" },
  { value: "Power Only", label: "Power Only" },
  { value: "Box Truck 26'", label: "Box Truck 26'" },
  { value: "Hotshot 40'", label: "Hotshot 40'" },
];

function isoToDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.split("T")[0];
}

function centsToInputString(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0 ? String(dollars) : dollars.toFixed(2);
}

export function EditLoadModal({ isOpen, onClose, load, customers }: EditLoadModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState(load.customerId ?? "");
  const [origin, setOrigin] = useState(load.origin.address ?? "");
  const [destination, setDestination] = useState(load.destination.address ?? "");
  const [pickupDate, setPickupDate] = useState(isoToDateInputValue(load.origin.windowStart));
  const [deliveryDate, setDeliveryDate] = useState(isoToDateInputValue(load.destination.windowStart));
  const [shipperRate, setShipperRate] = useState(centsToInputString(load.shipperRate));
  const [carrierPay, setCarrierPay] = useState(centsToInputString(load.carrierPay));
  const [equipmentType, setEquipmentType] = useState(load.equipmentType ?? "");
  const [commodity, setCommodity] = useState(load.commodity ?? "");
  const [weightLbs, setWeightLbs] = useState(load.weightLbs != null ? String(load.weightLbs) : "");

  // If the stored value (e.g. "Dry Van" from legacy wizard input) isn't in the
  // standard list, add it as an option so the select pre-selects it correctly.
  const storedEquipmentType = load.equipmentType ?? "";
  const equipmentSelectOptions = [
    { value: "", label: "— Select —" },
    ...(storedEquipmentType && !EQUIPMENT_OPTIONS.some((o) => o.value === storedEquipmentType)
      ? [{ value: storedEquipmentType, label: storedEquipmentType }]
      : []),
    ...EQUIPMENT_OPTIONS,
  ];

  // Live broker margin calculation
  const parsedShipperRate = parseFloat(shipperRate) || 0;
  const parsedCarrierPay = parseFloat(carrierPay) || 0;
  const brokerMargin = parsedShipperRate - parsedCarrierPay;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await updateLoadDetails(load.id, {
          customerId: customerId || undefined,
          origin,
          destination,
          pickupDate: pickupDate || undefined,
          deliveryDate: deliveryDate || undefined,
          shipperRate,
          carrierPay,
          equipmentType: equipmentType || undefined,
          commodity: commodity || undefined,
          weightLbs: weightLbs || undefined,
        });
        onClose();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save changes");
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Load Details"
      description="Update shipment details. Carrier assignment and status are managed separately."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        {/* Customer */}
        <div>
          <TailAdminLabel htmlFor="edit-customer">
            <User className="inline h-3.5 w-3.5 mr-1.5 text-slate-400" />
            Customer
          </TailAdminLabel>
          <TailAdminSelect
            id="edit-customer"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            options={[
              { value: "", label: "— No customer assigned —" },
              ...customers.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>

        {/* Origin & Destination */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <TailAdminLabel htmlFor="edit-origin">
              <MapPin className="inline h-3.5 w-3.5 mr-1.5 text-blue-500" />
              Origin
            </TailAdminLabel>
            <TailAdminInput
              id="edit-origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. Chicago, IL 60601"
              required
            />
          </div>
          <div>
            <TailAdminLabel htmlFor="edit-destination">
              <MapPin className="inline h-3.5 w-3.5 mr-1.5 text-emerald-500" />
              Destination
            </TailAdminLabel>
            <TailAdminInput
              id="edit-destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Houston, TX 77001"
              required
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <TailAdminLabel htmlFor="edit-pickup">
              <Calendar className="inline h-3.5 w-3.5 mr-1.5 text-slate-400" />
              Pickup Date
            </TailAdminLabel>
            <TailAdminInput
              id="edit-pickup"
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
            />
          </div>
          <div>
            <TailAdminLabel htmlFor="edit-delivery">
              <Calendar className="inline h-3.5 w-3.5 mr-1.5 text-slate-400" />
              Delivery Date
            </TailAdminLabel>
            <TailAdminInput
              id="edit-delivery"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>
        </div>

        {/* Rates */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-slate-400" />
            Financial Terms
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <TailAdminLabel htmlFor="edit-shipper-rate">Shipper Rate ($)</TailAdminLabel>
              <TailAdminInput
                id="edit-shipper-rate"
                value={shipperRate}
                onChange={(e) => setShipperRate(e.target.value)}
                placeholder="3200.00"
                required
              />
            </div>
            <div>
              <TailAdminLabel htmlFor="edit-carrier-pay">Carrier Pay ($)</TailAdminLabel>
              <TailAdminInput
                id="edit-carrier-pay"
                value={carrierPay}
                onChange={(e) => setCarrierPay(e.target.value)}
                placeholder="2850.00"
                required
              />
            </div>
            <div>
              <TailAdminLabel>Broker Margin (live)</TailAdminLabel>
              <div
                className={`flex h-10 items-center rounded-lg border px-3 text-sm font-semibold ${
                  brokerMargin >= 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                ${brokerMargin.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Equipment & cargo */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <TailAdminLabel htmlFor="edit-equipment">
              <Truck className="inline h-3.5 w-3.5 mr-1.5 text-slate-400" />
              Equipment Type
            </TailAdminLabel>
            <TailAdminSelect
              id="edit-equipment"
              value={equipmentType}
              onChange={(e) => setEquipmentType(e.target.value)}
              options={equipmentSelectOptions}
            />
          </div>
          <div>
            <TailAdminLabel htmlFor="edit-commodity">Commodity</TailAdminLabel>
            <TailAdminInput
              id="edit-commodity"
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              placeholder="e.g. General Freight"
            />
          </div>
          <div>
            <TailAdminLabel htmlFor="edit-weight">Weight (lbs)</TailAdminLabel>
            <TailAdminInput
              id="edit-weight"
              value={weightLbs}
              onChange={(e) => setWeightLbs(e.target.value)}
              placeholder="e.g. 42000"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
          <TailAdminButton
            variant="outline"
            size="sm"
            type="button"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </TailAdminButton>
          <TailAdminButton
            variant="primary"
            size="sm"
            type="submit"
            loading={isPending}
          >
            Save Changes
          </TailAdminButton>
        </div>
      </form>
    </Modal>
  );
}

export default EditLoadModal;
