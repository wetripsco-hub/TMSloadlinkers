"use server";

import { revalidatePath } from "next/cache";
import { createCustomer, updateCustomer, type CreateCustomerInput } from "@/lib/repositories/customers";
import { getOwnerContext } from "@/lib/auth/require-admin";
import type { UUID } from "../../../../types/domain";

export async function createCustomerAction(input: CreateCustomerInput) {
  if (!input.name || input.name.trim().length === 0) {
    throw new Error("Customer name is required");
  }

  const customer = await createCustomer({
    name: input.name.trim(),
    contactName: input.contactName?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    billingAddress: input.billingAddress?.trim() || null,
  });

  revalidatePath("/customers");
  revalidatePath("/loads");
  return customer;
}

export async function updateCustomerAction(id: UUID, input: CreateCustomerInput) {
  const owner = await getOwnerContext();
  if (!owner) {
    throw new Error("Only the organization owner can edit a customer record");
  }

  if (!input.name || input.name.trim().length === 0) {
    throw new Error("Customer name is required");
  }

  const customer = await updateCustomer(id, {
    name: input.name.trim(),
    contactName: input.contactName?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    billingAddress: input.billingAddress?.trim() || null,
  });

  revalidatePath("/customers");
  revalidatePath("/loads");
  return customer;
}
