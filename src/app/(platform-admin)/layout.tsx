import React from "react";
import type { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { AdminLayoutShell } from "@/components/platform-admin/admin-layout-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Platform Admin | FreightLink Console",
  description: "Platform Administration and Cross-Tenant Operations Console",
};

export default async function PlatformAdminGroupRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
