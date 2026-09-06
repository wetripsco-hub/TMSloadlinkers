import React from "react";
import type { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Platform Admin | FreightLink Console",
};

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  return <div>{children}</div>;
}
