import { createClient } from "@/lib/supabase/server";
import type { AppNotification, NotificationType, UUID } from "../../../types/domain";

interface NotificationRow {
  id: string;
  org_id: string;
  recipient_user_id: string | null;
  title: string;
  body: string;
  notification_type: NotificationType;
  source: string;
  entity_id: string | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

const NOTIFICATION_COLUMNS =
  "id, org_id, recipient_user_id, title, body, notification_type, source, entity_id, link_url, is_read, created_at";

function mapRowToNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    orgId: row.org_id,
    recipientUserId: row.recipient_user_id,
    title: row.title,
    body: row.body,
    notificationType: row.notification_type,
    source: row.source,
    entityId: row.entity_id,
    linkUrl: row.link_url,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

// RLS (notifications_select, 071_notifications.sql) already scopes this to
// the caller's own org plus their own or org-wide (recipient_user_id null)
// rows -- no additional WHERE clause needed here.
export async function listNotifications(limit = 20): Promise<AppNotification[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data as unknown as NotificationRow[]).map(mapRowToNotification);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

// The notifications_guard_client_update trigger (071_notifications.sql)
// rejects any column change other than is_read, and rejects setting it
// back to false -- so this can only ever mark a notification read, never
// unread or otherwise edit it.
export async function markNotificationRead(id: UUID): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);

  if (error) {
    throw error;
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);

  if (error) {
    throw error;
  }
}
