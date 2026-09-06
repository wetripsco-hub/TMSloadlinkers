import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsNavTabs } from "@/components/settings/settings-nav-tabs";

export const metadata: Metadata = {
  title: "Organization Settings | FreightLink TMS",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Settings"
        subtitle="Manage your logistics company profile, dispatchers, subscription, and security."
        breadcrumbs={[{ label: "Settings", href: "/settings/organization" }]}
      />
      <SettingsNavTabs />
      <div>{children}</div>
    </div>
  );
}
