"use server";

import { revalidatePath } from "next/cache";
import { parseCents } from "@/lib/money";
import { createLoad } from "@/lib/repositories/loads";
import { createCustomer } from "@/lib/repositories/customers";
import type { UUID } from "../../../../types/domain";

export interface CreateLoadFormInput {
  customerId?: UUID | null;
  newCustomerName?: string | null;
  carrierId?: UUID | null;
  originCityState: string;
  destinationCityState: string;
  pickupDate?: string | null;
  deliveryDate?: string | null;
  equipmentType?: string | null;
  customerRate: string; // e.g. "2500" or "2500.00"
  carrierPay: string;   // e.g. "2000" or "2000.00"
}

export async function createQuickLoadAction(input: CreateLoadFormInput) {
  let resolvedCustomerId = input.customerId || null;

  // If customer name is provided but no customerId, create customer first
  if (!resolvedCustomerId && input.newCustomerName && input.newCustomerName.trim().length > 0) {
    const newCustomer = await createCustomer({
      name: input.newCustomerName.trim(),
    });
    resolvedCustomerId = newCustomer.id;
  }

  // Format origin and destination
  const originStr = input.originCityState.trim();
  const destStr = input.destinationCityState.trim();

  const load = await createLoad({
    customerId: resolvedCustomerId,
    carrierId: input.carrierId || null,
    origin: originStr,
    destination: destStr,
    pickupDate: input.pickupDate ? new Date(input.pickupDate).toISOString() : null,
    deliveryDate: input.deliveryDate ? new Date(input.deliveryDate).toISOString() : null,
    shipperRate: parseCents(input.customerRate || "0"),
    carrierPay: parseCents(input.carrierPay || "0"),
  });

  revalidatePath("/loads");
  return load;
}

export async function seedDemoDataAction() {
  const { seedDemoDataForCurrentOrg } = await import("@/lib/services/seed-demo-data");
  const result = await seedDemoDataForCurrentOrg();

  revalidatePath("/loads");
  revalidatePath("/carriers");
  revalidatePath("/customers");
  revalidatePath("/invoices");
  revalidatePath("/settlements");

  return result;
}

export async function assignCarrierAction(loadId: UUID, carrierId: UUID) {
  const { assignCarrier } = await import("@/lib/repositories/loads");
  const updated = await assignCarrier(loadId, carrierId);

  revalidatePath(`/loads/${loadId}`);
  revalidatePath("/loads");

  return updated;
}
