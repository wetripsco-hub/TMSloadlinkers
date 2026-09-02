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
