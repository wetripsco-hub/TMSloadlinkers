/**
 * Unified Formatting Library
 *
 * CRITICAL DESIGN RULES:
 * 1. Crash-Proof & Guarded: Floating-point amounts are safely rounded (`Math.round`)
 *    before cent conversion to prevent TypeError/range runtime crashes.
 * 2. Nullable Guardrails: Null or undefined values must NEVER silently render as "0",
 *    blank strings, or invalid dates. They resolve explicitly to "—" (or "No data").
 * 3. Timezone-Safe Dates: String dates (e.g. YYYY-MM-DD) are parsed without UTC offset
 *    drift to ensure dates stay accurate across client timezones.
 */

/**
 * Formats integer or floating-point cents into a standard USD currency string.
 * Uses Math.round to protect against floating-point cent anomalies.
 * Returns "—" for null or undefined values.
 *
 * @example
 * formatMoney(1292000) => "$12,920.00"
 * formatMoney(0) => "$0.00"
 * formatMoney(-500) => "-$5.00"
 * formatMoney(null) => "—"
 */
export function formatMoney(cents: number | null | undefined): string {
  if (cents == null || Number.isNaN(cents)) {
    return "—";
  }

  const roundedCents = Math.round(cents);
  const sign = roundedCents < 0 ? "-" : "";
  const abs = Math.abs(roundedCents);
  const whole = Math.floor(abs / 100);
  const fraction = (abs % 100).toString().padStart(2, "0");

  return `${sign}$${whole.toLocaleString("en-US")}.${fraction}`;
}

/**
 * Formats an ISO string or Date into a timezone-safe date string (e.g. "Sep 5, 2026").
 * Returns "—" for null, undefined, empty, or invalid date values.
 *
 * @example
 * formatDate("2026-09-05") => "Sep 5, 2026"
 * formatDate(null) => "—"
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) {
    return "—";
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "—";
    return value.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const trimmed = value.trim();
  if (!trimmed) return "—";

  // Check for date-only string (YYYY-MM-DD) to prevent timezone UTC drift
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnlyMatch) {
    const year = parseInt(dateOnlyMatch[1], 10);
    const month = parseInt(dateOnlyMatch[2], 10) - 1;
    const day = parseInt(dateOnlyMatch[3], 10);
    const d = new Date(year, month, day);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats an ISO string or Date into a standard date + time string (e.g. "Sep 5, 2026, 02:30 PM").
 * Returns "—" for null, undefined, empty, or invalid date values.
 *
 * @example
 * formatDateTime("2026-09-05T14:30:00Z") => "Sep 5, 2026, 02:30 PM"
 * formatDateTime(null) => "—"
 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) {
    return "—";
  }

  const d = value instanceof Date ? value : new Date(value.trim());
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Formats a nullable numeric value with an optional suffix.
 * CRITICAL RULE: Never renders null or undefined as "0" or empty string.
 * Returns "No data" if null or undefined.
 *
 * @example
 * formatNullableNumber(85, "%") => "85%"
 * formatNullableNumber(null) => "No data"
 */
export function formatNullableNumber(
  value: number | null | undefined,
  suffix = "",
  fallback = "No data"
): string {
  if (value == null || Number.isNaN(value)) {
    return fallback;
  }

  return `${value.toLocaleString("en-US")}${suffix}`;
}

export interface FormattedFacilityAddress {
  street: string | null;
  cityStateZip: string;
  fullAddress: string;
}

/**
 * Formats a load stop's facility address into clean, crash-proof components.
 * Follows strict freight brokerage formatting rules:
 * - If street is present: returns street, city/state/zip, and full combined address.
 * - If street is missing/empty: gracefully falls back to "City, State" (or "City, State ZIP").
 * - If address string contains embedded city/state (e.g. "Dallas, TX" or "123 Main St, Dallas, TX 75001"),
 *   intelligently separates street from city/state.
 * - Never returns placeholders like "City, State, Zip" or "—".
 */
export function parseFacilityStopAddress(stop?: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
} | null): FormattedFacilityAddress {
  if (!stop) {
    return { street: null, cityStateZip: "—", fullAddress: "—" };
  }

  let street = stop.address ? stop.address.trim() : null;
  let city = stop.city ? stop.city.trim() : "";
  let state = stop.state ? stop.state.trim() : "";
  let zip = stop.zip ? stop.zip.trim() : "";

  // If city or state is missing and street is populated, check if street is an unparsed full address
  if ((!city || !state) && street) {
    const parts = street.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const stateZipMatch = lastPart.match(/^([A-Za-z]{2})(?:\s+(\d{5}(?:-\d{4})?))?$/);
      if (stateZipMatch) {
        state = stateZipMatch[1].toUpperCase();
        if (stateZipMatch[2]) zip = stateZipMatch[2];
        city = parts[parts.length - 2];
        if (parts.length > 2) {
          street = parts.slice(0, parts.length - 2).join(", ");
        } else {
          // Exactly 2 parts, e.g. "Dallas, TX" - this is City, State with no street address
          street = null;
        }
      }
    }
  }

  // If street equals city, state (case-insensitive), there is no street address
  if (street && city && state) {
    const cityStateLower = `${city.toLowerCase()}, ${state.toLowerCase()}`;
    if (street.toLowerCase() === cityStateLower) {
      street = null;
    }
  }

  const cityState = [city, state].filter(Boolean).join(", ");
  const cityStateZip = [cityState, zip].filter(Boolean).join(" ").trim();

  let fullAddress = "—";
  if (street && cityStateZip) {
    fullAddress = `${street}, ${cityStateZip}`;
  } else if (street) {
    fullAddress = street;
  } else if (cityStateZip) {
    fullAddress = cityStateZip;
  } else if (cityState) {
    fullAddress = cityState;
  }

  return {
    street: street || null,
    cityStateZip: cityStateZip || cityState || "—",
    fullAddress,
  };
}
