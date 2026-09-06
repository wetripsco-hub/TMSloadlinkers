import { describe, it, expect } from "vitest";
import {
  formatMoney,
  formatDate,
  formatDateTime,
  formatNullableNumber,
} from "./format";

describe("formatMoney", () => {
  it("formats valid integer cents properly", () => {
    expect(formatMoney(1292000)).toBe("$12,920.00");
    expect(formatMoney(100)).toBe("$1.00");
    expect(formatMoney(0)).toBe("$0.00");
  });

  it("handles negative cent values correctly", () => {
    expect(formatMoney(-500)).toBe("-$5.00");
    expect(formatMoney(-1292000)).toBe("-$12,920.00");
  });

  it("safely handles floating-point values without crashing", () => {
    expect(formatMoney(12920.499)).toBe("$129.20");
    expect(formatMoney(12920.6)).toBe("$129.21");
  });

  it("returns '—' for null, undefined, or NaN", () => {
    expect(formatMoney(null)).toBe("—");
    expect(formatMoney(undefined)).toBe("—");
    expect(formatMoney(NaN)).toBe("—");
  });
});

describe("formatDate", () => {
  it("formats date-only strings without timezone drift", () => {
    expect(formatDate("2026-09-05")).toBe("Sep 5, 2026");
  });

  it("formats Date objects properly", () => {
    const d = new Date(2026, 8, 5); // Sep 5, 2026
    expect(formatDate(d)).toBe("Sep 5, 2026");
  });

  it("returns '—' for null, undefined, empty, or invalid dates", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
    expect(formatDate("invalid-date")).toBe("—");
  });
});

describe("formatDateTime", () => {
  it("formats ISO timestamps properly", () => {
    const formatted = formatDateTime("2026-09-05T14:30:00Z");
    expect(formatted).not.toBe("—");
    expect(formatted).toContain("2026");
  });

  it("returns '—' for null, undefined, empty, or invalid dates", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
    expect(formatDateTime("")).toBe("—");
    expect(formatDateTime("not-a-date")).toBe("—");
  });
});

describe("formatNullableNumber", () => {
  it("formats valid numbers with optional suffix", () => {
    expect(formatNullableNumber(85, "%")).toBe("85%");
    expect(formatNullableNumber(1000)).toBe("1,000");
    expect(formatNullableNumber(0)).toBe("0");
  });

  it("returns 'No data' for null, undefined, or NaN", () => {
    expect(formatNullableNumber(null)).toBe("No data");
    expect(formatNullableNumber(undefined)).toBe("No data");
    expect(formatNullableNumber(NaN)).toBe("No data");
  });
});
