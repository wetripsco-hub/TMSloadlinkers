import "server-only";
import { createClient } from "@/lib/supabase/server";

// Populates the notifications table (071_notifications.sql) from the same
// conditions v_exceptions (046/055/058) already computes for the dashboard
// exception workbench -- so the same "needs attention" facts also show up
// in the bell dropdown, not just the banner.
//
// The actual query + dedup logic lives in sync_system_alert_notifications()
// (072_notification_rpcs.sql), a SECURITY DEFINER RPC that re-derives the
// caller's org_id from get_auth_user_org_id() rather than trusting a
// client-supplied value -- this is just the thin server-side wrapper any
// authenticated dashboard page can call.
export async function syncSystemAlertNotificationsForCurrentUser(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("sync_system_alert_notifications");

  if (error) {
    throw error;
  }
}
