"use client";

import { useState, type FormEvent } from "react";
import { Send, Building2, User, Users } from "lucide-react";
import {
  sendAdminNotificationAction,
  type NotificationTarget,
  type PlatformOrgOption,
  type PlatformUserOption,
} from "@/app/actions/platform-admin-notifications";

type TargetType = NotificationTarget["type"];

interface AdminNotificationFormProps {
  organizations: PlatformOrgOption[];
  users: PlatformUserOption[];
}

export function AdminNotificationForm({ organizations, users }: AdminNotificationFormProps) {
  const [targetType, setTargetType] = useState<TargetType>("org");
  const [orgId, setOrgId] = useState(organizations[0]?.orgId ?? "");
  const [userId, setUserId] = useState(users[0]?.userId ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; message: string } | null>(
    null
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setResult(null);

    let target: NotificationTarget;
    if (targetType === "org") {
      if (!orgId) {
        setResult({ kind: "error", message: "Choose an organization" });
        return;
      }
      target = { type: "org", orgId };
    } else if (targetType === "user") {
      if (!userId) {
        setResult({ kind: "error", message: "Choose a user" });
        return;
      }
      target = { type: "user", userId };
    } else {
      target = { type: "all" };
    }

    setIsSending(true);
    try {
      const count = await sendAdminNotificationAction(target, title, body);
      setResult({
        kind: "success",
        message: `Sent to ${count} organization${count === 1 ? "" : "s"}.`,
      });
      setTitle("");
      setBody("");
    } catch (err) {
      setResult({
        kind: "error",
        message: err instanceof Error ? err.message : "Failed to send notification",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
    >
      <div>
        <label className="mb-2 block text-xs font-semibold text-slate-700">Target</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setTargetType("org")}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
              targetType === "org"
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Specific organization
          </button>
          <button
            type="button"
            onClick={() => setTargetType("user")}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
              targetType === "user"
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <User className="h-4 w-4" />
            Specific user
          </button>
          <button
            type="button"
            onClick={() => setTargetType("all")}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
              targetType === "all"
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Users className="h-4 w-4" />
            All users
          </button>
        </div>
      </div>

      {targetType === "org" && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Organization</label>
          <select
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            {organizations.length === 0 && <option value="">No organizations found</option>}
            {organizations.map((org) => (
              <option key={org.orgId} value={org.orgId}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {targetType === "user" && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">User</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            {users.length === 0 && <option value="">No users found</option>}
            {users.map((user) => (
              <option key={user.userId} value={user.userId}>
                {(user.fullName || user.email || user.userId) +
                  (user.orgName ? ` — ${user.orgName}` : "")}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Scheduled maintenance tonight"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="We'll be performing maintenance from 11pm-1am ET. Expect brief downtime."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          required
        />
      </div>

      {result && (
        <p
          className={`text-xs font-medium ${
            result.kind === "success" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {result.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSending}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {isSending ? "Sending..." : "Send notification"}
      </button>
    </form>
  );
}

export default AdminNotificationForm;
