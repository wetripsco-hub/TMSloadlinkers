import { createClient } from "@/lib/supabase/server";
import type { Database } from "../../../types/database";
import type { Organization, UUID, WorkspaceType } from "../../../types/domain";

// The `organizations` table does not persist mcNumber/dotNumber (those live
// on individual carrier rows, not the brokerage's own org record). They are
// filled with null until the schema gains broker-authority columns.
interface OrganizationRow {
  id: string;
  name: string;
  workspace_type: WorkspaceType;
  created_at: string;
  address?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  bank_name?: string | null;
  routing_number?: string | null;
  account_number?: string | null;
  remittance_notes?: string | null;
  mc_number?: string | null;
  dot_number?: string | null;
  logo_url?: string | null;
}

const ORGANIZATION_COLUMNS =
  "id, name, workspace_type, created_at, address, contact_phone, contact_email, bank_name, routing_number, account_number, remittance_notes, mc_number, dot_number, logo_url";

function mapRowToOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    workspaceType: row.workspace_type,
    mcNumber: row.mc_number ?? null,
    dotNumber: row.dot_number ?? null,
    createdAt: row.created_at,
    address: row.address ?? null,
    contactPhone: row.contact_phone ?? null,
    contactEmail: row.contact_email ?? null,
    bankName: row.bank_name ?? null,
    routingNumber: row.routing_number ?? null,
    accountNumber: row.account_number ?? null,
    remittanceNotes: row.remittance_notes ?? null,
    logoUrl: row.logo_url ?? null,
  };
}

// Relies on the `organizations_select_own_org` RLS policy (Postgres, scoped
// to `profiles.org_id` for the calling user) for tenant isolation: a caller
// can only ever receive a row for their own organization, regardless of the
// id passed in.
export async function getOrganizationById(id: UUID): Promise<Organization | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select(ORGANIZATION_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  return mapRowToOrganization(data as unknown as OrganizationRow);
}

export async function getCurrentUserOrganization(): Promise<Organization | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.org_id) return null;

  return getOrganizationById(profile.org_id);
}

// ============================================================================
// Organization settings (020_org_settings.sql): contact person, logo,
// address, contact email/phone. Kept as a separate OrganizationSettings
// shape rather than folded into Organization above, since that domain type
// is used broadly (rate-con printing, etc.) and doesn't need these fields.
// ============================================================================

export interface OrganizationSettings {
  id: UUID;
  name: string;
  contactPersonName: string | null;
  logoUrl: string | null;
  address: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  bankName: string | null;
  routingNumber: string | null;
  accountNumber: string | null;
  remittanceNotes: string | null;
  mcNumber: string | null;
  dotNumber: string | null;
}

interface OrganizationSettingsRow {
  id: string;
  name: string;
  contact_person_name: string | null;
  logo_url: string | null;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  bank_name: string | null;
  routing_number: string | null;
  account_number: string | null;
  remittance_notes: string | null;
  mc_number: string | null;
  dot_number: string | null;
}

const ORGANIZATION_SETTINGS_COLUMNS =
  "id, name, contact_person_name, logo_url, address, contact_email, contact_phone, bank_name, routing_number, account_number, remittance_notes, mc_number, dot_number";

function mapRowToOrganizationSettings(row: OrganizationSettingsRow): OrganizationSettings {
  return {
    id: row.id as UUID,
    name: row.name,
    contactPersonName: row.contact_person_name,
    logoUrl: row.logo_url,
    address: row.address,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    bankName: row.bank_name,
    routingNumber: row.routing_number,
    accountNumber: row.account_number,
    remittanceNotes: row.remittance_notes,
    mcNumber: row.mc_number,
    dotNumber: row.dot_number,
  };
}

export async function getOrganization(orgId: UUID): Promise<OrganizationSettings | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select(ORGANIZATION_SETTINGS_COLUMNS)
    .eq("id", orgId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  return mapRowToOrganizationSettings(data as unknown as OrganizationSettingsRow);
}

export interface UpdateOrganizationInput {
  name: string;
  contactPersonName?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  bankName?: string | null;
  routingNumber?: string | null;
  accountNumber?: string | null;
  remittanceNotes?: string | null;
  mcNumber?: string | null;
  dotNumber?: string | null;
}

export async function updateOrganization(
  orgId: UUID,
  input: UpdateOrganizationInput
): Promise<OrganizationSettings> {
  const supabase = await createClient();

  const updatePayload: Database["public"]["Tables"]["organizations"]["Update"] = {
    name: input.name,
    contact_person_name: input.contactPersonName ?? null,
    logo_url: input.logoUrl ?? null,
    address: input.address ?? null,
    contact_email: input.contactEmail ?? null,
    contact_phone: input.contactPhone ?? null,
    bank_name: input.bankName ?? null,
    routing_number: input.routingNumber ?? null,
    account_number: input.accountNumber ?? null,
    remittance_notes: input.remittanceNotes ?? null,
  };

  if (input.mcNumber !== undefined) {
    updatePayload.mc_number = input.mcNumber || null;
  }
  if (input.dotNumber !== undefined) {
    updatePayload.dot_number = input.dotNumber || null;
  }

  const { data, error } = await supabase
    .from("organizations")
    .update(updatePayload)
    .eq("id", orgId)
    .select(ORGANIZATION_SETTINGS_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToOrganizationSettings(data as unknown as OrganizationSettingsRow);
}
