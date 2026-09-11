"use server";

import { randomBytes, createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isModuleKey, firstAllowedModulePath, type ModuleKey } from "@/lib/domain/modules";
import type { Database } from "../../../../../types/database";

type Role = Database["public"]["Enums"]["user_role_type"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Never trust the client's module list as-is: dedupe and drop anything
// that isn't a known key, mirroring the CHECK constraint on
// profiles/invitations.allowed_modules (044_profile_invite_allowed_modules.sql)
// so a bad request fails here with a clear error instead of at the DB.
function sanitizeAllowedModules(modules: string[]): ModuleKey[] {
  return Array.from(new Set(modules.filter(isModuleKey)));
}

export async function inviteMember(email: string, role: Role, allowedModules: string[]) {
  const admin = await getAdminContext();
  if (!admin) {
    throw new Error("You must be an org admin to invite members");
  }

  if (role === "owner") {
    throw new Error("Cannot invite a member as owner");
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new Error("Enter a valid email address");
  }

  const sanitizedModules = sanitizeAllowedModules(allowedModules);
  if (sanitizedModules.length === 0) {
    throw new Error("Select at least one module for this member to access");
  }

  const supabase = await createClient();

  const { data: seatsUsed, error: seatsError } = await supabase.rpc("seats_used", {
    p_org_id: admin.orgId,
  });
  if (seatsError) throw seatsError;

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("seat_limit")
    .eq("org_id", admin.orgId)
    .maybeSingle();
  if (subscriptionError) throw subscriptionError;

  if ((seatsUsed ?? 0) >= (subscription?.seat_limit ?? 0)) {
    throw new Error("Your organization has no seats remaining. Upgrade your plan to invite more members.");
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const { error: insertError } = await supabase.from("invitations").insert({
    org_id: admin.orgId,
    email: normalizedEmail,
    role,
    allowed_modules: sanitizedModules,
    token_hash: tokenHash,
    invited_by: admin.userId,
  });

  if (insertError) throw insertError;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const inviteUrl = `${appUrl}/invite/${token}`;

  revalidatePath("/settings/team");

  return { ok: true, inviteUrl };
}

export async function revokeInvite(inviteId: string) {
  const admin = await getAdminContext();
  if (!admin) {
    throw new Error("You must be an org admin to revoke invites");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("org_id", admin.orgId)
    .is("accepted_at", null);

  if (error) throw error;

  revalidatePath("/settings/team");
}

export async function setMemberActive(memberId: string, isActive: boolean) {
  const admin = await getAdminContext();
  if (!admin) {
    throw new Error("You must be an org admin to manage members");
  }

  if (memberId === admin.userId) {
    throw new Error("You cannot deactivate your own account");
  }

  const supabase = await createClient();

  const { data: member, error: memberError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", memberId)
    .eq("org_id", admin.orgId)
    .maybeSingle();
  if (memberError) throw memberError;
  if (!member) throw new Error("Member not found");
  if (member.role === "owner") {
    throw new Error("The organization owner cannot be deactivated");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", memberId)
    .eq("org_id", admin.orgId);

  if (error) throw error;

  revalidatePath("/settings/team");
}

export async function updateMemberAllowedModules(memberId: string, allowedModules: string[]) {
  const admin = await getAdminContext();
  if (!admin) {
    throw new Error("You must be an org admin to manage member access");
  }

  const sanitizedModules = sanitizeAllowedModules(allowedModules);
  if (sanitizedModules.length === 0) {
    throw new Error("Select at least one module for this member to access");
  }

  const supabase = await createClient();

  const { data: member, error: memberError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", memberId)
    .eq("org_id", admin.orgId)
    .maybeSingle();
  if (memberError) throw memberError;
  if (!member) throw new Error("Member not found");
  // Owners are always unrestricted in code (lib/domain/modules.ts,
  // middleware.ts, AppSidebar.tsx) regardless of this column's contents,
  // so editing it for an owner would be a no-op at best -- refuse
  // explicitly rather than letting it look like it did something.
  if (member.role === "owner") {
    throw new Error("The organization owner's access cannot be restricted");
  }

  // Same RLS gap as setMemberActive above: profiles' only UPDATE policy is
  // `profiles_update_own_row: (id = auth.uid())`, so this write must go
  // through the service-role client. The role/org_id check above (plus the
  // org_id filter repeated here) is what actually authorizes it.
  const serviceClient = createServiceClient();
  const { data: updated, error } = await serviceClient
    .from("profiles")
    .update({ allowed_modules: sanitizedModules })
    .eq("id", memberId)
    .eq("org_id", admin.orgId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!updated) throw new Error("Member not found");

  revalidatePath("/settings/team");
}

// Read-only invite lookup (hash + validity checks), with no auth
// requirement of its own -- shared by acceptInvite below (which additionally
// requires a signed-in session) and by app/invite/[token]/page.tsx, which
// needs the invite's email to pre-fill a sign-up form for a visitor who
// isn't signed in yet. Keeping this in one place means neither caller
// reimplements the token-hash/expiry/revoked/accepted checks.
export async function getInviteByToken(token: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const serviceClient = createServiceClient();

  const { data: invite, error: inviteError } = await serviceClient
    .from("invitations")
    .select("id, org_id, email, role, allowed_modules, accepted_at, revoked_at, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (inviteError) throw inviteError;
  if (!invite) {
    return { ok: false as const, error: "This invite link is invalid" };
  }
  if (invite.accepted_at) {
    return { ok: false as const, error: "This invite has already been accepted" };
  }
  if (invite.revoked_at) {
    return { ok: false as const, error: "This invite has been revoked" };
  }
  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    return { ok: false as const, error: "This invite has expired" };
  }

  return { ok: true as const, invite };
}

export async function acceptInvite(
  token: string
): Promise<{ ok: true; redirectTo: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to accept this invite" };
  }

  const lookup = await getInviteByToken(token);
  if (!lookup.ok) {
    return lookup;
  }
  const { invite } = lookup;
  const serviceClient = createServiceClient();

  if (invite.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return { ok: false, error: "This invite was sent to a different email address" };
  }

  const { data: profile, error: profileError } = await serviceClient
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (profile?.org_id) {
    return { ok: false, error: "You already belong to an organization" };
  }

  const { data: seatsUsed, error: seatsError } = await serviceClient.rpc("seats_used", {
    p_org_id: invite.org_id,
  });
  if (seatsError) throw seatsError;

  const { data: subscription, error: subscriptionError } = await serviceClient
    .from("subscriptions")
    .select("seat_limit")
    .eq("org_id", invite.org_id)
    .maybeSingle();
  if (subscriptionError) throw subscriptionError;

  if ((seatsUsed ?? 0) >= (subscription?.seat_limit ?? 0)) {
    return { ok: false, error: "This organization has no seats remaining" };
  }

  // The invite sign-up form (invite-signup-form.tsx) passes the entered
  // name into auth.signUp()'s options.data, since it's captured client-side
  // before a session exists and there's nowhere else to hand it off to
  // through the email-confirmation redirect. handle_new_auth_user()
  // (001_foundation.sql) only ever seeds id/email, so full_name is still
  // null here for a brand-new invited profile -- safe to set unconditionally.
  const fullNameFromSignup =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";

  const { error: profileUpdateError } = await serviceClient
    .from("profiles")
    .update({
      org_id: invite.org_id,
      role: invite.role,
      is_active: true,
      allowed_modules: invite.allowed_modules,
      ...(fullNameFromSignup ? { full_name: fullNameFromSignup } : {}),
    })
    .eq("id", user.id);
  if (profileUpdateError) throw profileUpdateError;

  const { error: acceptError } = await serviceClient
    .from("invitations")
    .update({ accepted_at: new Date().toISOString(), accepted_by: user.id })
    .eq("id", invite.id);
  if (acceptError) throw acceptError;

  return { ok: true, redirectTo: firstAllowedModulePath(invite.allowed_modules, invite.role) };
}
