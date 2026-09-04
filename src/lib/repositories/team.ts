import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "../../../types/database";

export type MemberRole = Database["public"]["Enums"]["user_role_type"];

export interface TeamMember {
  id: string;
  fullName: string | null;
  role: MemberRole;
  isActive: boolean;
  createdAt: string;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: MemberRole;
  createdAt: string;
  expiresAt: string;
}

export interface TeamOverview {
  members: TeamMember[];
  invites: TeamInvite[];
  seatsUsed: number;
  seatLimit: number;
}

export async function getTeamOverview(orgId: string): Promise<TeamOverview> {
  const supabase = await createClient();

  const [{ data: members, error: membersError }, { data: invites, error: invitesError }, { data: seatsUsed, error: seatsError }, { data: subscription, error: subscriptionError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, role, is_active, created_at")
        .eq("org_id", orgId)
        .order("created_at", { ascending: true }),
      supabase
        .from("invitations")
        .select("id, email, role, created_at, expires_at")
        .eq("org_id", orgId)
        .is("accepted_at", null)
        .is("revoked_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true }),
      supabase.rpc("seats_used", { p_org_id: orgId }),
      supabase.from("subscriptions").select("seat_limit").eq("org_id", orgId).maybeSingle(),
    ]);

  if (membersError) throw membersError;
  if (invitesError) throw invitesError;
  if (seatsError) throw seatsError;
  if (subscriptionError) throw subscriptionError;

  return {
    members: (members ?? []).map((member) => ({
      id: member.id,
      fullName: member.full_name,
      role: member.role,
      isActive: member.is_active,
      createdAt: member.created_at,
    })),
    invites: (invites ?? []).map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      createdAt: invite.created_at,
      expiresAt: invite.expires_at,
    })),
    seatsUsed: seatsUsed ?? 0,
    seatLimit: subscription?.seat_limit ?? 0,
  };
}
