import { createClient } from "@/lib/supabase/server";
import type { UUID } from "../../../types/domain";

/**
 * Ensures that the current authenticated user has an active organization.
 * If profiles.org_id is null or the organization row is missing:
 * - Automatically creates a default organization ("LoadLinkers Logistics", workspace_type: "freight_brokerage")
 * - Updates the user's profile with the new org_id
 * - If auto-creation fails, gracefully returns null (allowing caller to redirect to /signup)
 */
export async function ensureUserOrganization(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<UUID | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // 1. Check existing profile and org_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.org_id) {
      // Verify that this organization actually exists and is accessible
      const { data: existingOrg } = await supabase
        .from("organizations")
        .select("id")
        .eq("id", profile.org_id)
        .maybeSingle();

      if (existingOrg?.id) {
        return existingOrg.id as UUID;
      }
    }

    // 2. Organization missing or null -> automatically create default organization
    const { data: newOrg, error: orgCreateError } = await supabase
      .from("organizations")
      .insert({
        name: "LoadLinkers Logistics",
        workspace_type: "freight_brokerage",
      })
      .select("id")
      .single();

    if (orgCreateError || !newOrg?.id) {
      console.warn("Automatic organization creation failed:", orgCreateError?.message);
      return null;
    }

    const orgId = newOrg.id as UUID;

    // 3. Update the user's profile with this new org_id
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        org_id: orgId,
        role: "owner",
      })
      .eq("id", user.id);

    if (profileUpdateError) {
      console.warn("Failed to update profile with new org_id:", profileUpdateError.message);
      // Attempt upsert in case profile row wasn't created yet
      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        org_id: orgId,
        role: "owner",
        full_name: user.user_metadata?.full_name || "Broker Agent",
      });
    }

    return orgId;
  } catch (err) {
    console.error("Unhandled error in ensureUserOrganization:", err);
    return null;
  }
}
