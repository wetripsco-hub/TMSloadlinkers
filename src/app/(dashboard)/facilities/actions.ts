"use server";

import { revalidatePath } from "next/cache";
import {
  createFacility,
  updateFacility,
  deleteFacility,
  type CreateFacilityInput,
} from "@/lib/repositories/facilities";
import { facilityFormSchema, type FacilityFormValues } from "@/lib/validations/facility";
import type { Facility, UUID } from "../../../../types/domain";

function toRepositoryInput(values: FacilityFormValues): CreateFacilityInput {
  const parsed = facilityFormSchema.parse(values);

  return {
    customerId: parsed.customerId || null,
    name: parsed.name,
    address: parsed.address || null,
    city: parsed.city,
    state: parsed.state,
    zip: parsed.zip || null,
    contactName: parsed.contactName || null,
    contactPhone: parsed.contactPhone || null,
    contactEmail: parsed.contactEmail || null,
    appointmentRequired: parsed.appointmentRequired,
    operatingHours: parsed.operatingHours || null,
    notes: parsed.notes || null,
  };
}

export async function createFacilityAction(values: FacilityFormValues): Promise<Facility> {
  const facility = await createFacility(toRepositoryInput(values));

  revalidatePath("/facilities");
  revalidatePath("/loads/new");
  return facility;
}

export async function updateFacilityAction(id: UUID, values: FacilityFormValues): Promise<Facility> {
  const facility = await updateFacility(id, toRepositoryInput(values));

  revalidatePath("/facilities");
  revalidatePath("/loads/new");
  return facility;
}

export async function deleteFacilityAction(id: UUID): Promise<void> {
  await deleteFacility(id);

  revalidatePath("/facilities");
  revalidatePath("/loads/new");
}
