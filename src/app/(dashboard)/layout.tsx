import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureUserOrganization } from "@/lib/services/ensure-user-organization";
import { getAccessStatus } from "@/lib/subscription/guard";
import { AccessBanner } from "@/components/billing/access-banner";
import { SidebarProvider } from "@/context/SidebarContext";
import DashboardShell from "@/layout/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Resolve the user's organization, if one is already linked and still exists.
  const orgId = await ensureUserOrganization(supabase);

  // profiles.org_id is null (no org assigned, the linked org row is missing,
  // or the user is waiting on a team invite) -> send them to /onboarding
  // rather than deeper into the dashboard.
  if (!orgId) {
    redirect("/onboarding");
  }

  const access = await getAccessStatus();

  const { data: organization } = await supabase
    .from("organizations")
    .select("name, workspace_type")
    .eq("id", orgId)
    .maybeSingle();

  return (
    <SidebarProvider
      orgName={organization?.name ?? null}
      workspaceType={organization?.workspace_type ?? null}
    >
      <DashboardShell>
        <div className="space-y-6">
          <AccessBanner status={access} />
          {children}
        </div>
      </DashboardShell>
    </SidebarProvider>
  );
}
