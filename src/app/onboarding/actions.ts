"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const WORKSPACE_TYPES = ["freight_brokerage", "truck_dispatch", "hybrid_enterprise"] as const;
type WorkspaceType = (typeof WORKSPACE_TYPES)[number];

export interface CreateOrganizationInput {
  orgName: string;
  workspaceType: WorkspaceType;
}

export interface CreateOrganizationResult {
  error: string;
}

/**
 * Creates (or reattaches to) the caller's organization via the idempotent
 * complete_onboarding RPC, then forces the dashboard layout to see the
 * fresh org_id and sends the user straight in. Safe to retry: if the
 * profile already has an org_id (a previous partial attempt landed it, or
 * this races another in-flight call), the RPC returns that org_id instead
 * of throwing a duplicate error.
 */
export async function createOrganizationAction(
  input: CreateOrganizationInput
): Promise<CreateOrganizationResult | never> {
  const orgName = input.orgName.trim();

  if (!orgName) {
    return { error: "Organization name is required" };
  }
  if (!WORKSPACE_TYPES.includes(input.workspaceType)) {
    return { error: "Select a workspace type" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.rpc("complete_onboarding", {
    p_org_name: orgName,
    p_workspace_type: input.workspaceType,
  });

  if (error) {
    return { error: error.message };
  }

  // profiles.org_id changed underneath (dashboard)/layout.tsx's server-side
  // read; force it to re-fetch instead of serving a cached RSC payload from
  // before onboarding completed.
  revalidatePath("/", "layout");
  redirect("/overview");
}
