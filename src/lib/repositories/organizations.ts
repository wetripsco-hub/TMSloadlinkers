import { createClient } from "@/lib/supabase/server";
import type { Organization, UUID, WorkspaceType } from "../../../types/domain";

// The `organizations` table does not persist mcNumber/dotNumber (those live
// on individual carrier rows, not the brokerage's own org record). They are
// filled with null until the schema gains broker-authority columns.
interface OrganizationRow {
  id: string;
  name: string;
  workspace_type: WorkspaceType;
  created_at: string;
}

const ORGANIZATION_COLUMNS = "id, name, workspace_type, created_at";

function mapRowToOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    workspaceType: row.workspace_type,
    mcNumber: null,
    dotNumber: null,
    createdAt: row.created_at,
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
}

interface OrganizationSettingsRow {
  id: string;
  name: string;
  contact_person_name: string | null;
  logo_url: string | null;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

const ORGANIZATION_SETTINGS_COLUMNS =
  "id, name, contact_person_name, logo_url, address, contact_email, contact_phone";

function mapRowToOrganizationSettings(row: OrganizationSettingsRow): OrganizationSettings {
  return {
    id: row.id as UUID,
    name: row.name,
    contactPersonName: row.contact_person_name,
    logoUrl: row.logo_url,
    address: row.address,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
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
}

export async function updateOrganization(
  orgId: UUID,
  input: UpdateOrganizationInput
): Promise<OrganizationSettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .update({
      name: input.name,
      contact_person_name: input.contactPersonName ?? null,
      logo_url: input.logoUrl ?? null,
      address: input.address ?? null,
      contact_email: input.contactEmail ?? null,
      contact_phone: input.contactPhone ?? null,
    })
    .eq("id", orgId)
    .select(ORGANIZATION_SETTINGS_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToOrganizationSettings(data as unknown as OrganizationSettingsRow);
}
