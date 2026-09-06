"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Building2, Upload } from "lucide-react";
import {
  organizationSettingsSchema,
  type OrganizationSettingsValues,
} from "@/lib/validations/organization";
import { updateOrganizationSettings } from "@/app/(dashboard)/settings/organization/actions";
import type { OrganizationSettings } from "@/lib/repositories/organizations";

const FIELD_CLASS =
  "block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-slate-700";

export function OrganizationSettingsForm({ organization }: { organization: OrganizationSettings }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(organization.logoUrl);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationSettingsValues>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      name: organization.name,
      contactPersonName: organization.contactPersonName ?? "",
      address: organization.address ?? "",
      contactEmail: organization.contactEmail ?? "",
      contactPhone: organization.contactPhone ?? "",
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = (values: OrganizationSettingsValues) => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        await updateOrganizationSettings(values, logoFile);
        setSuccess(true);
        setLogoFile(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save organization settings");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs md:p-6"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {logoPreview ? (
            <Image src={logoPreview} alt="Organization logo" width={64} height={64} className="h-full w-full object-cover" unoptimized />
          ) : (
            <Building2 className="h-7 w-7 text-slate-400" />
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload logo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleLogoChange}
          />
          <p className="mt-1 text-xs text-slate-500">PNG, JPEG, WebP, or SVG, up to 2MB.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLASS}>
            Company name <span className="text-rose-500">*</span>
          </label>
          <input className={FIELD_CLASS} {...register("name")} />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Contact person name</label>
          <input className={FIELD_CLASS} {...register("contactPersonName")} />
        </div>

        <div className="sm:col-span-2">
          <label className={LABEL_CLASS}>Address</label>
          <input className={FIELD_CLASS} {...register("address")} />
        </div>

        <div>
          <label className={LABEL_CLASS}>Contact email</label>
          <input className={FIELD_CLASS} type="email" {...register("contactEmail")} />
          {errors.contactEmail && (
            <p className="mt-1 text-xs text-red-600">{errors.contactEmail.message}</p>
          )}
        </div>

        <div>
          <label className={LABEL_CLASS}>Contact phone</label>
          <input className={FIELD_CLASS} type="tel" {...register("contactPhone")} />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Organization settings saved.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 transition-colors"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Changes
      </button>
    </form>
  );
}
