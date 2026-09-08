import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth/require-admin";
import { getOrganization } from "@/lib/repositories/organizations";
import { OrganizationSettingsForm } from "@/components/settings/organization-settings-form";
import { RestartTourCard } from "@/components/onboarding/restart-tour-card";

export const dynamic = "force-dynamic";

export default async function OrganizationSettingsPage() {
  const admin = await getAdminContext();

  if (!admin) {
    redirect("/overview");
  }

  const organization = await getOrganization(admin.orgId);

  if (!organization) {
    redirect("/overview");
  }

  return (
    <div className="space-y-6">
      <OrganizationSettingsForm organization={organization} />
      <RestartTourCard />
    </div>
  );
}
