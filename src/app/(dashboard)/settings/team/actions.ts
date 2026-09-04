"use server";

import { randomBytes, createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "../../../../../types/database";

type Role = Database["public"]["Enums"]["user_role_type"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function inviteMember(email: string, role: Role) {
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

export async function acceptInvite(token: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to accept this invite" };
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const serviceClient = createServiceClient();

  const { data: invite, error: inviteError } = await serviceClient
    .from("invitations")
    .select("id, org_id, email, role, accepted_at, revoked_at, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (inviteError) throw inviteError;
  if (!invite) {
    return { ok: false, error: "This invite link is invalid" };
  }
  if (invite.accepted_at) {
    return { ok: false, error: "This invite has already been accepted" };
  }
  if (invite.revoked_at) {
    return { ok: false, error: "This invite has been revoked" };
  }
  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    return { ok: false, error: "This invite has expired" };
  }

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

  const { error: profileUpdateError } = await serviceClient
    .from("profiles")
    .update({ org_id: invite.org_id, role: invite.role, is_active: true })
    .eq("id", user.id);
  if (profileUpdateError) throw profileUpdateError;

  const { error: acceptError } = await serviceClient
    .from("invitations")
    .update({ accepted_at: new Date().toISOString(), accepted_by: user.id })
    .eq("id", invite.id);
  if (acceptError) throw acceptError;

  return { ok: true };
}
