import { createClient } from "@/lib/supabase/server";
import type { UUID } from "../../../types/domain";

export interface CustomerRecord {
  id: string;
  orgId: string;
  name: string;
  email: string | null;
  phone: string | null;
  billingAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CustomerRow {
  id: string;
  org_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  created_at: string;
  updated_at: string;
}

const CUSTOMER_COLUMNS =
  "id, org_id, name, email, phone, billing_address, created_at, updated_at";

function mapRowToCustomer(row: CustomerRow): CustomerRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    billingAddress: row.billing_address,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListCustomersFilters {
  name?: string;
  email?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface ListCustomersResult {
  data: CustomerRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateCustomerInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  billingAddress?: string | null;
}

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

  if (!error && data?.org_id) {
    return data.org_id;
  }

  const { ensureUserOrganization } = await import("@/lib/services/ensure-user-organization");
  const fallbackOrgId = await ensureUserOrganization(supabase);
  if (fallbackOrgId) {
    return fallbackOrgId;
  }

  throw new Error("No organization found for current user profile");
}

export async function listCustomers(
  filters: ListCustomersFilters = {},
  pagination: Pagination = { page: 1, pageSize: 50 }
): Promise<ListCustomersResult> {
  const supabase = await createClient();
  const { page, pageSize } = pagination;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("customers")
    .select(CUSTOMER_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.name) {
    query = query.ilike("name", `%${filters.name}%`);
  }
  if (filters.email) {
    query = query.ilike("email", `%${filters.email}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    data: (data as unknown as CustomerRow[]).map(mapRowToCustomer),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getCustomerById(id: UUID): Promise<CustomerRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select(CUSTOMER_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  return mapRowToCustomer(data as unknown as CustomerRow);
}

export async function createCustomer(input: CreateCustomerInput): Promise<CustomerRecord> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);

  const { data, error } = await supabase
    .from("customers")
    .insert({
      org_id: orgId,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      billing_address: input.billingAddress ?? null,
    })
    .select(CUSTOMER_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToCustomer(data as unknown as CustomerRow);
}
