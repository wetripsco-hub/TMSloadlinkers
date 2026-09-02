import { createClient } from "@/lib/supabase/server";
import type { ISODateTime, UUID } from "../../../types/domain";

export interface AuditEvent {
  id: UUID;
  actorUserId: UUID | null;
  action: "insert" | "update" | "delete";
  beforeJson: Record<string, unknown> | null;
  afterJson: Record<string, unknown> | null;
  createdAt: ISODateTime;
}

interface AuditEventRow {
  id: string;
  actor_user_id: string | null;
  action: "insert" | "update" | "delete";
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  created_at: string;
}

function mapRowToAuditEvent(row: AuditEventRow): AuditEvent {
  return {
    id: row.id,
    actorUserId: row.actor_user_id,
    action: row.action,
    beforeJson: row.before_json,
    afterJson: row.after_json,
    createdAt: row.created_at,
  };
}

export async function listAuditEvents(
  entityType: string,
  entityId: UUID
): Promise<AuditEvent[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_events")
    .select("id, actor_user_id, action, before_json, after_json, created_at")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as unknown as AuditEventRow[]).map(mapRowToAuditEvent);
}
