"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/tailadmin/modal";
import {
  TailAdminInput,
  TailAdminSelect,
  TailAdminLabel,
  TailAdminButton,
} from "@/components/ui/tailadmin/form-elements";
import { createQuickLoadAction } from "@/app/(dashboard)/loads/actions";
import { Plus, MapPin, DollarSign, Calendar, Truck, User } from "lucide-react";
import type { CustomerRecord } from "@/lib/repositories/customers";
import type { CarrierRecord } from "@/lib/repositories/carriers";

export interface CreateLoadModalProps {
  customers: CustomerRecord[];
  carriers: CarrierRecord[];
  onSuccess?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
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

export const CreateLoadModal: React.FC<CreateLoadModalProps> = ({
  customers,
  carriers,
  onSuccess,
  isOpen: controlledIsOpen,
  onOpenChange,
  trigger,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === "boolean";
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (val: boolean) => {
    if (isControlled) {
      onOpenChange?.(val);
    } else {
      setInternalIsOpen(val);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [newCustomerName, setNewCustomerName] = useState<string>("");
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>("");
  const [originCityState, setOriginCityState] = useState<string>("");
  const [destinationCityState, setDestinationCityState] = useState<string>("");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [equipmentType, setEquipmentType] = useState<string>("53' Dry Van");
  const [customerRate, setCustomerRate] = useState<string>("");
  const [carrierPay, setCarrierPay] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCustomerId && (!newCustomerName || newCustomerName.trim().length === 0)) {
      setError("Please select an existing customer or enter a customer name.");
      return;
    }

    if (!originCityState.trim()) {
      setError("Origin City/State is required (e.g. Chicago, IL).");
      return;
    }

    if (!destinationCityState.trim()) {
      setError("Destination City/State is required (e.g. Atlanta, GA).");
      return;
    }

    try {
      setIsSubmitting(true);
      await createQuickLoadAction({
        customerId: selectedCustomerId || null,
        newCustomerName: !selectedCustomerId ? newCustomerName : null,
        carrierId: selectedCarrierId || null,
        originCityState,
        destinationCityState,
        pickupDate: pickupDate || null,
        deliveryDate: deliveryDate || null,
        equipmentType,
        customerRate: customerRate || "0",
        carrierPay: carrierPay || "0",
      });

      // Reset form
      setSelectedCustomerId("");
      setNewCustomerName("");
      setSelectedCarrierId("");
      setOriginCityState("");
      setDestinationCityState("");
      setPickupDate("");
      setDeliveryDate("");
      setCustomerRate("");
      setCarrierPay("");
      setIsOpen(false);

      router.refresh();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error("Failed to create load:", err);
      setError(err instanceof Error ? err.message : "Failed to create load. Please check inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {trigger !== undefined ? (
        trigger
      ) : (
        <TailAdminButton
          onClick={() => setIsOpen(true)}
          variant="primary"
          size="md"
          startIcon={<Plus className="h-4 w-4" />}
        >
          Create Load
        </TailAdminButton>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create New Freight Load"
        description="Book a new shipment with origin, destination, and financial dispatch terms."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Customer Selection */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800/80 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-brand-500" />
              <h4 className="text-xs font-bold tracking-wider uppercase text-gray-700 dark:text-gray-300">
                Customer / Shipper Account
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <TailAdminLabel htmlFor="existing-customer">Select Shipper</TailAdminLabel>
                <TailAdminSelect
                  id="existing-customer"
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    if (e.target.value) setNewCustomerName("");
                  }}
                  placeholder="Choose customer..."
                  options={customers.map((c) => ({ value: c.id, label: c.name }))}
                />
              </div>
              <div>
                <TailAdminLabel htmlFor="new-customer">Or New Shipper Name</TailAdminLabel>
                <TailAdminInput
                  id="new-customer"
                  placeholder="e.g. Acme Logistics Corp"
                  value={newCustomerName}
                  disabled={!!selectedCustomerId}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Route Details */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800/80 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-emerald-500" />
              <h4 className="text-xs font-bold tracking-wider uppercase text-gray-700 dark:text-gray-300">
                Route & Schedule
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <TailAdminLabel htmlFor="origin" required>Origin (City, State)</TailAdminLabel>
                <TailAdminInput
                  id="origin"
                  placeholder="e.g. Chicago, IL"
                  value={originCityState}
                  onChange={(e) => setOriginCityState(e.target.value)}
                  required
                />
              </div>
              <div>
                <TailAdminLabel htmlFor="destination" required>Destination (City, State)</TailAdminLabel>
                <TailAdminInput
                  id="destination"
                  placeholder="e.g. Atlanta, GA"
                  value={destinationCityState}
                  onChange={(e) => setDestinationCityState(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <TailAdminLabel htmlFor="pickup-date">Pickup Date</TailAdminLabel>
                <TailAdminInput
                  id="pickup-date"
                  type="date"
                  startIcon={<Calendar className="h-4 w-4" />}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
              </div>
              <div>
                <TailAdminLabel htmlFor="delivery-date">Delivery Date</TailAdminLabel>
                <TailAdminInput
                  id="delivery-date"
                  type="date"
                  startIcon={<Calendar className="h-4 w-4" />}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Equipment & Carrier Assignment */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800/80 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="h-4 w-4 text-sky-500" />
              <h4 className="text-xs font-bold tracking-wider uppercase text-gray-700 dark:text-gray-300">
                Equipment & Carrier Assignment
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <TailAdminLabel htmlFor="equipment">Equipment Type</TailAdminLabel>
                <TailAdminSelect
                  id="equipment"
                  value={equipmentType}
                  onChange={(e) => setEquipmentType(e.target.value)}
                  options={EQUIPMENT_OPTIONS}
                />
              </div>
              <div>
                <TailAdminLabel htmlFor="assigned-carrier">Assign Carrier (Optional)</TailAdminLabel>
                <TailAdminSelect
                  id="assigned-carrier"
                  value={selectedCarrierId}
                  onChange={(e) => setSelectedCarrierId(e.target.value)}
                  placeholder="Select carrier or Leave Unassigned"
                  options={carriers.map((c) => ({
                    value: c.id,
                    label: `${c.companyName} (${c.mcNumber ? `MC ${c.mcNumber}` : `DOT ${c.dotNumber}`})`,
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800/80 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-amber-500" />
              <h4 className="text-xs font-bold tracking-wider uppercase text-gray-700 dark:text-gray-300">
                Financial Terms (USD)
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <TailAdminLabel htmlFor="shipper-rate" required>
                  Customer Rate ($)
                </TailAdminLabel>
                <TailAdminInput
                  id="shipper-rate"
                  type="number"
                  step={0.01}
                  placeholder="e.g. 2850.00"
                  value={customerRate}
                  onChange={(e) => setCustomerRate(e.target.value)}
                  startIcon={<span className="text-sm font-bold">$</span>}
                  required
                />
              </div>
              <div>
                <TailAdminLabel htmlFor="carrier-pay">Carrier Pay ($)</TailAdminLabel>
                <TailAdminInput
                  id="carrier-pay"
                  type="number"
                  step={0.01}
                  placeholder="e.g. 2200.00"
                  value={carrierPay}
                  onChange={(e) => setCarrierPay(e.target.value)}
                  startIcon={<span className="text-sm font-bold">$</span>}
                />
              </div>
            </div>

            {/* Estimated Margin Preview */}
            {customerRate && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-100/80 px-3 py-2 text-xs font-semibold text-gray-700 dark:bg-white/5 dark:text-gray-300">
                <span>Estimated Broker Margin:</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  ${(parseFloat(customerRate || "0") - parseFloat(carrierPay || "0")).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <TailAdminButton
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </TailAdminButton>
            <TailAdminButton
              type="submit"
              variant="primary"
              size="md"
              loading={isSubmitting}
            >
              {isSubmitting ? "Creating Load..." : "Create Load"}
            </TailAdminButton>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default CreateLoadModal;
