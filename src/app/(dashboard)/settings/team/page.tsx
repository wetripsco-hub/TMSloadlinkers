import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth/require-admin";
import { getTeamOverview } from "@/lib/repositories/team";
import { PageBreadcrumb } from "@/components/common/PageBreadCrumb";
import { TeamPanel } from "@/components/team/team-panel";

export const dynamic = "force-dynamic";

export default async function TeamSettingsPage() {
  const admin = await getAdminContext();

  if (!admin) {
    redirect("/overview");
  }

  const team = await getTeamOverview(admin.orgId);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Team" />
      <TeamPanel team={team} />
    </div>
  );
}
