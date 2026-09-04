import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureUserOrganization } from "@/lib/services/ensure-user-organization";
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

  // Ensure user has an organization assigned or auto-create LoadLinkers Logistics
  const orgId = await ensureUserOrganization(supabase);

  // profiles.org_id is null (no org assigned, auto-creation failed, or the
  // user is waiting on a team invite) -> send them to /onboarding rather
  // than deeper into the dashboard.
  if (!orgId) {
    redirect("/onboarding");
  }

  return (
    <SidebarProvider>
      <DashboardShell>{children}</DashboardShell>
    </SidebarProvider>
  );
}
