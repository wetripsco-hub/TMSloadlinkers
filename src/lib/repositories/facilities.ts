import { createClient } from "@/lib/supabase/server";
import type { Facility, UUID } from "../../../types/domain";

interface FacilityRow {
  id: string;
  org_id: string;
  customer_id: string | null;
  name: string;
  address: string | null;
  city: string;
  state: string;
  zip: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  appointment_required: boolean;
  operating_hours: string | null;
  notes: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

const FACILITY_COLUMNS =
  "id, org_id, customer_id, name, address, city, state, zip, contact_name, contact_phone, contact_email, appointment_required, operating_hours, notes, created_by_user_id, created_at, updated_at";

function mapRowToFacility(row: FacilityRow): Facility {
  return {
    id: row.id,
    orgId: row.org_id,
    customerId: row.customer_id,
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    appointmentRequired: row.appointment_required,
    operatingHours: row.operating_hours,
    notes: row.notes,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Same pattern as lib/repositories/loads.ts / documents.ts / quotes.ts:
// org_id is never accepted as a parameter, only ever resolved server-side
// from the caller's own profile, so a caller can never target another
// tenant.
async function getCurrentOrgId(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<UUID> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (error || !data?.org_id) {
    throw new Error("No organization found for current user profile");
  }

  return data.org_id;
}

export interface ListFacilitiesFilters {
  // undefined: no customer filter (every facility in the org).
  // null: shared/org-wide facilities only (customer_id is null).
  // UUID: that customer's own facilities only -- does NOT also include
  // shared ones; callers wanting "this customer's + shared" (the load
  // wizard's autofill dropdown) combine that themselves, since a plain
  // list-with-filter is more broadly reusable than one query that always
  // bakes in the wizard's specific OR-shared behavior.
  customerId?: UUID | null;
}

export async function listFacilities(filters: ListFacilitiesFilters = {}): Promise<Facility[]> {
  const supabase = await createClient();

  let query = supabase
    .from("facilities")
    .select(FACILITY_COLUMNS)
    .order("name", { ascending: true });

  if (filters.customerId !== undefined) {
    query = filters.customerId === null ? query.is("customer_id", null) : query.eq("customer_id", filters.customerId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data as unknown as FacilityRow[]).map(mapRowToFacility);
}

export async function getFacilityById(id: UUID): Promise<Facility | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("facilities")
    .select(FACILITY_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  return mapRowToFacility(data as unknown as FacilityRow);
}

export interface CreateFacilityInput {
  customerId?: UUID | null;
  name: string;
  address?: string | null;
  city: string;
  state: string;
  zip?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  appointmentRequired?: boolean;
  operatingHours?: string | null;
  notes?: string | null;
}

export async function createFacility(input: CreateFacilityInput): Promise<Facility> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("facilities")
    .insert({
      org_id: orgId,
      customer_id: input.customerId ?? null,
      name: input.name,
      address: input.address ?? null,
      city: input.city,
      state: input.state,
      zip: input.zip ?? null,
      contact_name: input.contactName ?? null,
      contact_phone: input.contactPhone ?? null,
      contact_email: input.contactEmail ?? null,
      appointment_required: input.appointmentRequired ?? false,
      operating_hours: input.operatingHours ?? null,
      notes: input.notes ?? null,
      created_by_user_id: user?.id ?? null,
    })
    .select(FACILITY_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToFacility(data as unknown as FacilityRow);
}

// Same shape as CreateFacilityInput -- the edit form always submits a
// complete set of values (react-hook-form's handleSubmit gives the whole
// form state, not a diff), so this replaces every editable column in one
// call rather than supporting a partial patch nothing here actually needs.
export type UpdateFacilityInput = CreateFacilityInput;

export async function updateFacility(id: UUID, input: UpdateFacilityInput): Promise<Facility> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("facilities")
    .update({
      customer_id: input.customerId ?? null,
      name: input.name,
      address: input.address ?? null,
      city: input.city,
      state: input.state,
      zip: input.zip ?? null,
      contact_name: input.contactName ?? null,
      contact_phone: input.contactPhone ?? null,
      contact_email: input.contactEmail ?? null,
      appointment_required: input.appointmentRequired ?? false,
      operating_hours: input.operatingHours ?? null,
      notes: input.notes ?? null,
    })
    .eq("id", id)
    .select(FACILITY_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToFacility(data as unknown as FacilityRow);
}

export async function deleteFacility(id: UUID): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("facilities").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
