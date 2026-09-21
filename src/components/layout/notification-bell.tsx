"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, AlertTriangle, Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dropdown } from "@/components/ui/tailadmin/dropdown";
import type { AppNotification, NotificationType } from "../../../types/domain";

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  notification_type: NotificationType;
  source: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

function mapRowToNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    orgId: "",
    recipientUserId: null,
    title: row.title,
    body: row.body,
    notificationType: row.notification_type,
    source: row.source,
    entityId: null,
    linkUrl: row.link_url,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, notification_type, source, link_url, is_read, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications((data as unknown as NotificationRow[]).map(mapRowToNotification));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Poll rather than a realtime subscription -- the bell only needs to be
    // eventually consistent, and this matches the rest of the dashboard's
    // "fetch on load" pattern instead of adding a new realtime channel.
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      if (!prev) fetchNotifications();
      return !prev;
    });
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    setIsOpen(false);

    if (!notification.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      const supabase = createClient();
      await supabase.from("notifications").update({ is_read: true }).eq("id", notification.id);
    }

    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="dropdown-toggle relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5">
          <p className="text-sm font-semibold text-slate-800">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <Check className="h-3 w-3" />
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading && notifications.length === 0 ? (
            <p className="px-3.5 py-6 text-center text-xs text-slate-400">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="px-3.5 py-6 text-center text-xs text-slate-400">
              You&apos;re all caught up.
            </p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex w-full items-start gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-slate-50 ${
                      notification.isRead ? "bg-white" : "bg-blue-50/60"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {notification.notificationType === "admin_message" ? (
                        <Megaphone className="h-4 w-4 text-indigo-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`truncate text-xs ${
                            notification.isRead ? "font-medium text-slate-700" : "font-semibold text-slate-900"
                          }`}
                        >
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500 line-clamp-2">
                        {notification.body}
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-400">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Dropdown>
    </div>
  );
}

export default NotificationBell;
