"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/tailadmin/modal";
import {
  TailAdminInput,
  TailAdminLabel,
  TailAdminTextarea,
  TailAdminButton,
} from "@/components/ui/tailadmin/form-elements";
import { createCustomerAction } from "@/app/(dashboard)/customers/actions";
import { Plus, Building2, Mail, Phone } from "lucide-react";

export interface AddCustomerModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function AddCustomerModal({
  isOpen: controlledIsOpen,
  onOpenChange,
  trigger,
  onSuccess,
}: AddCustomerModalProps = {}) {
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

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Customer name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createCustomerAction({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        billingAddress: billingAddress.trim() || null,
      });

      setName("");
      setEmail("");
      setPhone("");
      setBillingAddress("");
      setIsOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      console.error("Failed to create customer:", err);
      setError(err instanceof Error ? err.message : "Failed to create customer.");
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
          + New Customer
        </TailAdminButton>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add New Shipper / Customer"
        description="Register a shipper account to create loads and generate customer invoices."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
              {error}
            </div>
          )}

          <div>
            <TailAdminLabel htmlFor="cust-name" required>
              Company / Shipper Name
            </TailAdminLabel>
            <TailAdminInput
              id="cust-name"
              placeholder="e.g. Acme Industrial Supply"
              value={name}
              onChange={(e) => setName(e.target.value)}
              startIcon={<Building2 className="h-4 w-4" />}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <TailAdminLabel htmlFor="cust-email" required>
                Billing Email
              </TailAdminLabel>
              <TailAdminInput
                id="cust-email"
                type="email"
                placeholder="invoices@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                startIcon={<Mail className="h-4 w-4" />}
              />
            </div>
            <div>
              <TailAdminLabel htmlFor="cust-phone">Phone Number</TailAdminLabel>
              <TailAdminInput
                id="cust-phone"
                type="tel"
                placeholder="(555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                startIcon={<Phone className="h-4 w-4" />}
              />
            </div>
          </div>

          <div>
            <TailAdminLabel htmlFor="cust-address">Billing Address</TailAdminLabel>
            <TailAdminTextarea
              id="cust-address"
              rows={2}
              placeholder="123 Corporate Blvd, Suite 400, Dallas, TX 75201"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
            />
          </div>

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
              {isSubmitting ? "Creating Customer..." : "Create Customer"}
            </TailAdminButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default AddCustomerModal;
