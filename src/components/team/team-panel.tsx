"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail, UserX, UserCheck, XCircle } from "lucide-react";
import Badge, { type BadgeColor } from "@/components/ui/tailadmin/badge";
import {
  inviteMember,
  revokeInvite,
  setMemberActive,
} from "@/app/(dashboard)/settings/team/actions";
import type { TeamOverview, MemberRole } from "@/lib/repositories/team";

const ROLE_BADGE: Record<MemberRole, BadgeColor> = {
  owner: "primary",
  admin: "info",
  member: "success",
  viewer: "light",
};

const INVITABLE_ROLES: MemberRole[] = ["member", "admin", "viewer"];

export function TeamPanel({ team }: { team: TeamOverview }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("member");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const seatsFull = team.seatsUsed >= team.seatLimit;

  const handleInvite = (event: React.FormEvent) => {
    event.preventDefault();
    setInviteError(null);
    setInviteUrl(null);
    startTransition(async () => {
      try {
        const result = await inviteMember(email, role);
        setInviteUrl(result.inviteUrl);
        setEmail("");
      } catch (error) {
        setInviteError(error instanceof Error ? error.message : "Failed to send invite");
      }
    });
  };

  const handleRevoke = (inviteId: string) => {
    setPendingId(inviteId);
    startTransition(async () => {
      try {
        await revokeInvite(inviteId);
      } finally {
        setPendingId(null);
      }
    });
  };

  const handleToggleActive = (memberId: string, isActive: boolean) => {
    setPendingId(memberId);
    startTransition(async () => {
      try {
        await setMemberActive(memberId, isActive);
      } finally {
        setPendingId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div
        className={`flex items-center justify-between rounded-2xl border p-4 text-sm font-medium shadow-xs ${
          seatsFull
            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400"
            : "border-gray-200 bg-white text-gray-600 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300"
        }`}
      >
        <span>
          {team.seatsUsed} / {team.seatLimit} seats used
        </span>
        {seatsFull && <span>No seats remaining — upgrade your plan to invite more members</span>}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900/60 md:p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Invite a member</h3>
        <form onSubmit={handleInvite} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@company.com"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Role
            </label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as MemberRole)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {INVITABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={isPending || seatsFull}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Send invite
          </button>
        </form>
        {inviteError && <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{inviteError}</p>}
        {inviteUrl && (
          <p className="mt-2 break-all text-sm text-emerald-600 dark:text-emerald-400">
            Invite created: {inviteUrl}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900/60">
        <h3 className="border-b border-gray-100 px-5 py-4 text-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white">
          Members
        </h3>
        <ul>
          {team.members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3 last:border-b-0 dark:border-gray-800"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {member.fullName ?? "Unnamed member"}
                </span>
                <Badge color={ROLE_BADGE[member.role]} size="sm">
                  {member.role}
                </Badge>
                {!member.isActive && (
                  <Badge color="error" size="sm">
                    Deactivated
                  </Badge>
                )}
              </div>
              {member.role !== "owner" && (
                <button
                  type="button"
                  onClick={() => handleToggleActive(member.id, !member.isActive)}
                  disabled={isPending && pendingId === member.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {member.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                  {member.isActive ? "Deactivate" : "Reactivate"}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {team.invites.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900/60">
          <h3 className="border-b border-gray-100 px-5 py-4 text-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white">
            Pending invites
          </h3>
          <ul>
            {team.invites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3 last:border-b-0 dark:border-gray-800"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{invite.email}</span>
                  <Badge color={ROLE_BADGE[invite.role]} size="sm">
                    {invite.role}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(invite.id)}
                  disabled={isPending && pendingId === invite.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
