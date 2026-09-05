import { createClient } from "@/lib/supabase/server";
import type { UUID } from "../../../types/domain";

/**
 * Resolves the current authenticated user's active organization, if any.
 * Verifies that profiles.org_id points to a real organizations row.
 * If profiles.org_id is null, or the organization row it points to is
 * missing, gracefully returns null (allowing the caller to redirect to
 * /onboarding). Never creates an organization itself -- complete_onboarding
 * is only ever called from the onboarding form and the signup page, where
 * the user has explicitly typed their real company name.
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
      // Verify that this organization actually exists and is accessible.
      const { data: existingOrg } = await supabase
        .from("organizations")
        .select("id")
        .eq("id", profile.org_id)
        .maybeSingle();

      if (existingOrg?.id) {
        return existingOrg.id as UUID;
      }
    }

    // 2. org_id is null, or pointed to a missing organization row -- do not
    // auto-create an org here. Let the caller redirect to /onboarding so the
    // user can create their organization with a real name.
    return null;
  } catch (err) {
    console.error("Unhandled error in ensureUserOrganization:", err);
    return null;
  }
}
