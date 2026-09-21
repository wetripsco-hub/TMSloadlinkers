"use server";

import { headers } from "next/headers";
import { getLoadById } from "@/lib/repositories/loads";
import { createNotificationProvider } from "@/lib/providers/notifications";
import { buildTrackingLinkMessage } from "@/lib/notifications/tracking-link-message";

const E164_PATTERN = /^\+[1-9]\d{1,14}$/;

export interface SendTrackingLinkResult {
  success: boolean;
  error: string | null;
}

// Best-effort normalization for what we send to the SMS API only -- never
// written back to driver_phone in the database. Keeps a leading '+' as-is
// (already-E.164 numbers pass through with just punctuation stripped); a
// bare 10-digit US number gets '+1' prepended; anything else is returned
// digits-only and will fail the E.164 check below, same as before
// normalization existed.
//
// Not exported: every export from a "use server" file must itself be an
// async Server Action (Next.js build error otherwise) -- this is exercised
// via sendTrackingLink()'s own tests instead of a direct unit test.
function normalizePhoneNumber(raw: string): string {
  const trimmed = raw.trim();
  const hasLeadingPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (hasLeadingPlus) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  return digits;
}

async function resolveBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function sendTrackingLink(loadId: string): Promise<SendTrackingLinkResult> {
  const load = await getLoadById(loadId);
  if (!load) {
    return { success: false, error: "Load not found" };
  }

  const rawPhone = load.driverPhone?.trim();
  if (!rawPhone) {
    return {
      success: false,
      error: "Driver phone number is missing or not a valid E.164 number (e.g. +15551234567)",
    };
  }

  const normalizedPhone = normalizePhoneNumber(rawPhone);
  if (!E164_PATTERN.test(normalizedPhone)) {
    return {
      success: false,
      error: "Driver phone number is missing or not a valid E.164 number (e.g. +15551234567)",
    };
  }

  const baseUrl = await resolveBaseUrl();
  const loadLabel = load.loadNumber || `LD-${load.id.slice(0, 6).toUpperCase()}`;
  const message = buildTrackingLinkMessage(loadLabel, load.trackingToken, baseUrl);

  const provider = createNotificationProvider();
  const result = await provider.send({ to: normalizedPhone, message });

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to send tracking link" };
  }

  return { success: true, error: null };
}
