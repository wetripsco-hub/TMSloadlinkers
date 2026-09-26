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
import { updateCustomerAction } from "@/app/(dashboard)/customers/actions";
import { Building2, Mail, Phone, User } from "lucide-react";
import type { CustomerRecord } from "@/lib/repositories/customers";

export interface EditCustomerModalProps {
  customer: CustomerRecord;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditCustomerModal({
  customer,
  isOpen,
  onOpenChange,
  onSuccess,
}: EditCustomerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [name, setName] = useState(customer.name);
  const [contactName, setContactName] = useState(customer.contactName ?? "");
  const [email, setEmail] = useState(customer.email ?? "");
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [billingAddress, setBillingAddress] = useState(customer.billingAddress ?? "");

  // Re-sync fields when a different customer's edit dialog opens, since the
  // component instance is shared across rows rather than remounted per row.
  const [loadedForId, setLoadedForId] = useState(customer.id);
  if (loadedForId !== customer.id) {
    setLoadedForId(customer.id);
    setName(customer.name);
    setContactName(customer.contactName ?? "");
    setEmail(customer.email ?? "");
    setPhone(customer.phone ?? "");
    setBillingAddress(customer.billingAddress ?? "");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Customer name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateCustomerAction(customer.id, {
        name: name.trim(),
        contactName: contactName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        billingAddress: billingAddress.trim() || null,
      });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      console.error("Failed to update customer:", err);
      setError(err instanceof Error ? err.message : "Failed to update customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      title="Edit Shipper / Customer"
      description="Correct any details that were entered wrong when this account was created."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
            {error}
          </div>
        )}

        <div>
          <TailAdminLabel htmlFor="edit-cust-name" required>
            Company / Shipper Name
          </TailAdminLabel>
          <TailAdminInput
            id="edit-cust-name"
            placeholder="e.g. Acme Industrial Supply"
            value={name}
            onChange={(e) => setName(e.target.value)}
            startIcon={<Building2 className="h-4 w-4" />}
            required
          />
        </div>

        <div>
          <TailAdminLabel htmlFor="edit-cust-contact-name">Contact Person</TailAdminLabel>
          <TailAdminInput
            id="edit-cust-contact-name"
            placeholder="e.g. Sarah Jenkins"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            startIcon={<User className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <TailAdminLabel htmlFor="edit-cust-email" required>
              Billing Email
            </TailAdminLabel>
            <TailAdminInput
              id="edit-cust-email"
              type="email"
              placeholder="invoices@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              startIcon={<Mail className="h-4 w-4" />}
            />
          </div>
          <div>
            <TailAdminLabel htmlFor="edit-cust-phone">Phone Number</TailAdminLabel>
            <TailAdminInput
              id="edit-cust-phone"
              type="tel"
              placeholder="(555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              startIcon={<Phone className="h-4 w-4" />}
            />
          </div>
        </div>

        <div>
          <TailAdminLabel htmlFor="edit-cust-address">Billing Address</TailAdminLabel>
          <TailAdminTextarea
            id="edit-cust-address"
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
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </TailAdminButton>
          <TailAdminButton type="submit" variant="primary" size="md" loading={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </TailAdminButton>
        </div>
      </form>
    </Modal>
  );
}

export default EditCustomerModal;
