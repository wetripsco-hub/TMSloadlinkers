import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { PageHeader } from "@/components/layout/page-header";
import { AdminNotificationForm } from "@/components/platform-admin/admin-notification-form";
import {
  listOrganizationsForNotificationPicker,
  listUsersForNotificationPicker,
} from "@/app/actions/platform-admin-notifications";

export const dynamic = "force-dynamic";

export default async function PlatformAdminNotificationsPage() {
  await requirePlatformAdmin();

  const [organizations, users] = await Promise.all([
    listOrganizationsForNotificationPicker(),
    listUsersForNotificationPicker(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Send Notification"
        subtitle="Message a specific organization, a specific user, or broadcast to every tenant user's bell dropdown."
        breadcrumbs={[
          { label: "Platform Admin", href: "/platform-admin" },
          { label: "Notifications", href: "/platform-admin/notifications" },
        ]}
      />
      <div className="max-w-2xl">
        <AdminNotificationForm organizations={organizations} users={users} />
      </div>
    </div>
  );
}
