import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { PageHeader } from "@/components/layout/page-header";
import {
  PlatformAuditLogTable,
  type PlatformAuditLogRow,
} from "@/components/platform-admin/audit-log-table";
import { ErrorState } from "@/components/ui/error-state";

export const dynamic = "force-dynamic";

interface AuditLogRecord {
  id: string;
  actor_admin_id: string | null;
  action: string;
  org_id: string | null;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  created_at: string;
  organizations: { name: string } | null;
}

export default async function PlatformAdminAuditLogPage() {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("platform_audit_log")
    .select("id, actor_admin_id, action, org_id, before_json, after_json, created_at, organizations(name)")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Platform Audit Log"
          subtitle="Immutable cross-tenant audit trail of all administrative and destructive system operations."
          breadcrumbs={[
            { label: "Platform Admin", href: "/platform-admin" },
            { label: "Audit Logs", href: "/platform-admin/audit-log" },
          ]}
        />
        <ErrorState
          title="Failed to load platform audit logs"
          description={error.message}
        />
      </div>
    );
  }

  const logs = (data ?? []) as unknown as AuditLogRecord[];

  // Resolve actor emails/names from profiles table
  const actorIds = [...new Set(logs.map((l) => l.actor_admin_id).filter(Boolean))] as string[];
  const { data: actorProfiles } = actorIds.length
    ? await supabase.from("profiles").select("id, email, full_name").in("id", actorIds)
    : { data: [] as { id: string; email: string | null; full_name: string | null }[] };

  const actorMap = new Map((actorProfiles ?? []).map((p) => [p.id, p]));

  const rows: PlatformAuditLogRow[] = logs.map((log) => {
    const actor = log.actor_admin_id ? actorMap.get(log.actor_admin_id) : undefined;

    return {
      id: log.id,
      actorId: log.actor_admin_id,
      actorEmail: actor?.email ?? null,
      actorName: actor?.full_name ?? null,
      action: log.action,
      orgId: log.org_id,
      orgName: log.organizations?.name ?? null,
      beforeJson: log.before_json,
      afterJson: log.after_json,
      createdAt: log.created_at,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Audit Log"
        subtitle="Immutable cross-tenant audit trail of all administrative and destructive system operations."
        breadcrumbs={[
          { label: "Platform Admin", href: "/platform-admin" },
          { label: "Audit Logs", href: "/platform-admin/audit-log" },
        ]}
      />
      <PlatformAuditLogTable logs={rows} />
    </div>
  );
}
