"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getOrganization, updateOrganization } from "@/lib/repositories/organizations";
import {
  organizationSettingsSchema,
  type OrganizationSettingsValues,
} from "@/lib/validations/organization";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/svg+xml", "image/webp"]);

export async function updateOrganizationSettings(
  values: OrganizationSettingsValues,
  logoFile: File | null
) {
  // The client-side org_admin check in the form is UX only; the real gate
  // is here (getAdminContext) and, underneath it, the organizations_update
  // _own_org_admin RLS policy (020_org_settings.sql) -- a non-admin caller
  // is rejected even if this action were invoked directly.
  const admin = await getAdminContext();
  if (!admin) {
    throw new Error("You must be an org admin to update organization settings");
  }

  const parsed = organizationSettingsSchema.safeParse(values);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid organization settings");
  }

  const supabase = await createClient();
  const existing = await getOrganization(admin.orgId);
  let logoUrl: string | null = existing?.logoUrl ?? null;

  if (logoFile && logoFile.size > 0) {
    if (logoFile.size > MAX_LOGO_BYTES) {
      throw new Error("Logo must be smaller than 2MB");
    }
    if (!ALLOWED_LOGO_TYPES.has(logoFile.type)) {
      throw new Error("Logo must be a PNG, JPEG, WebP, or SVG image");
    }

    const extension = logoFile.name.split(".").pop() || "png";
    const objectPath = `${admin.orgId}/logo-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("org-logos")
      .upload(objectPath, logoFile, {
        contentType: logoFile.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload logo: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from("org-logos").getPublicUrl(objectPath);
    logoUrl = publicUrlData.publicUrl;
  }

  const organization = await updateOrganization(admin.orgId, {
    name: parsed.data.name,
    contactPersonName: parsed.data.contactPersonName || null,
    address: parsed.data.address || null,
    contactEmail: parsed.data.contactEmail || null,
    contactPhone: parsed.data.contactPhone || null,
    logoUrl,
  });

  revalidatePath("/settings/organization");
  revalidatePath("/", "layout");

  return organization;
}
