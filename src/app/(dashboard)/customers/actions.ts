"use server";

import { revalidatePath } from "next/cache";
import { createCustomer, type CreateCustomerInput } from "@/lib/repositories/customers";

export async function createCustomerAction(input: CreateCustomerInput) {
  if (!input.name || input.name.trim().length === 0) {
    throw new Error("Customer name is required");
  }

  const customer = await createCustomer({
    name: input.name.trim(),
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    billingAddress: input.billingAddress?.trim() || null,
  });

  revalidatePath("/customers");
  revalidatePath("/loads");
  return customer;
}
