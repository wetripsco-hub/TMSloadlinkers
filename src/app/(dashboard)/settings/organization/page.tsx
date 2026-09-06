import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth/require-admin";
import { getOrganization } from "@/lib/repositories/organizations";
import { OrganizationSettingsForm } from "@/components/settings/organization-settings-form";

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

  return <OrganizationSettingsForm organization={organization} />;
}
