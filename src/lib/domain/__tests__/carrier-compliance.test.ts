import { describe, expect, it } from "vitest";

import { deriveComplianceBadge, isCarrierEligibleForDispatch } from "../carrier-compliance";
import type { Carrier, CarrierVerificationResult } from "../../../../types/domain";

const NOW = new Date("2026-09-03T00:00:00.000Z");

function daysFromNow(days: number): string {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function makeCarrier(overrides: Partial<Carrier> = {}): Carrier {
  return {
    id: "carrier-1",
    orgId: "org-1",
    companyName: "Acme Trucking",
    dotNumber: "123456",
    mcNumber: "654321",
    safetyRating: "Satisfactory",
    authorityStatus: "active",
    insuranceCarrierName: "Progressive",
    insurancePolicyNumber: "POL-1",
    insuranceExpiryDate: daysFromNow(90),
    cargoCoverageLimit: 10_000_00,
    autoLiabilityLimit: 100_000_00,
    isBlacklisted: false,
    blacklistReason: null,
    isInternalFleet: false,
    dispatchFeePercentage: 0,
    dispatchFeeFlatWeekly: 0,
    lastVerifiedAt: NOW.toISOString(),
    ...overrides,
  };
}

function makeVerification(
  overrides: Partial<CarrierVerificationResult> = {}
): CarrierVerificationResult {
  return {
    authorityActive: true,
    safetyRating: "Satisfactory",
    insuranceOnFile: true,
    outOfServiceDate: null,
    source: "fmcsa",
    fetchedAt: NOW.toISOString(),
    raw: {},
    ...overrides,
  };
}

const REQUIREMENTS = { minCargoCents: 10_000_00, minAutoLiabilityCents: 100_000_00 };

describe("deriveComplianceBadge", () => {
  it("returns verified when authority is active, insurance is on file, and rating is satisfactory", () => {
    expect(deriveComplianceBadge(makeCarrier(), makeVerification(), NOW)).toBe("verified");
  });

  it("treats a None safety rating as satisfying the verified condition", () => {
    expect(
      deriveComplianceBadge(
        makeCarrier({ insuranceExpiryDate: daysFromNow(90) }),
        makeVerification({ safetyRating: "None" }),
        NOW
      )
    ).toBe("verified");
  });

  it("returns blocked when the carrier is blacklisted, regardless of a clean verification", () => {
    expect(
      deriveComplianceBadge(makeCarrier({ isBlacklisted: true }), makeVerification(), NOW)
    ).toBe("blocked");
  });

  it("returns blocked when the verification reports an out-of-service date", () => {
    expect(
      deriveComplianceBadge(
        makeCarrier(),
        makeVerification({ outOfServiceDate: "2026-08-01" }),
        NOW
      )
    ).toBe("blocked");
  });

  it("returns blocked when the safety rating is Unsatisfactory", () => {
    expect(
      deriveComplianceBadge(makeCarrier(), makeVerification({ safetyRating: "Unsatisfactory" }), NOW)
    ).toBe("blocked");
  });

  it("blocked takes precedence over an expiring insurance window", () => {
    expect(
      deriveComplianceBadge(
        makeCarrier({ isBlacklisted: true, insuranceExpiryDate: daysFromNow(5) }),
        makeVerification(),
        NOW
      )
    ).toBe("blocked");
  });

  it("returns expiring when insurance expires exactly 30 days out (boundary)", () => {
    expect(
      deriveComplianceBadge(
        makeCarrier({ insuranceExpiryDate: daysFromNow(30) }),
        makeVerification(),
        NOW
      )
    ).toBe("expiring");
  });

  it("returns verified when insurance expires 31 days out (just past the boundary)", () => {
    expect(
      deriveComplianceBadge(
        makeCarrier({ insuranceExpiryDate: daysFromNow(31) }),
        makeVerification(),
        NOW
      )
    ).toBe("verified");
  });

  it("returns expiring when insurance already lapsed", () => {
    expect(
      deriveComplianceBadge(
        makeCarrier({ insuranceExpiryDate: daysFromNow(-5) }),
        makeVerification(),
        NOW
      )
    ).toBe("expiring");
  });

  it("returns unverified when authority is not active but nothing is blocked or expiring", () => {
    expect(
      deriveComplianceBadge(makeCarrier(), makeVerification({ authorityActive: false }), NOW)
    ).toBe("unverified");
  });

  it("returns unverified when insurance is not on file", () => {
    expect(
      deriveComplianceBadge(makeCarrier(), makeVerification({ insuranceOnFile: false }), NOW)
    ).toBe("unverified");
  });

  it("returns unverified for a Conditional safety rating", () => {
    expect(
      deriveComplianceBadge(makeCarrier(), makeVerification({ safetyRating: "Conditional" }), NOW)
    ).toBe("unverified");
  });

  it("treats safety rating comparisons as case-insensitive", () => {
    expect(
      deriveComplianceBadge(makeCarrier(), makeVerification({ safetyRating: "unsatisfactory" }), NOW)
    ).toBe("blocked");
  });
});

describe("isCarrierEligibleForDispatch", () => {
  it("is eligible when every requirement is met exactly at the minimum boundary", () => {
    const result = isCarrierEligibleForDispatch(
      makeCarrier({ cargoCoverageLimit: 10_000_00, autoLiabilityLimit: 100_000_00 }),
      makeVerification(),
      REQUIREMENTS,
      NOW
    );

    expect(result).toEqual({ eligible: true, reasons: [] });
  });

  it("is ineligible when cargo coverage is one cent below the minimum", () => {
    const result = isCarrierEligibleForDispatch(
      makeCarrier({ cargoCoverageLimit: 10_000_00 - 1 }),
      makeVerification(),
      REQUIREMENTS,
      NOW
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("Cargo coverage is below the required minimum");
  });

  it("is ineligible when auto liability coverage is one cent below the minimum", () => {
    const result = isCarrierEligibleForDispatch(
      makeCarrier({ autoLiabilityLimit: 100_000_00 - 1 }),
      makeVerification(),
      REQUIREMENTS,
      NOW
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("Auto liability coverage is below the required minimum");
  });

  it("is ineligible with a blacklist reason surfaced in the reasons list", () => {
    const result = isCarrierEligibleForDispatch(
      makeCarrier({ isBlacklisted: true, blacklistReason: "Cargo theft claim" }),
      makeVerification(),
      REQUIREMENTS,
      NOW
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("Carrier is blacklisted: Cargo theft claim");
  });

  it("is ineligible when out of service, with a generic reason when blacklistReason is null", () => {
    const result = isCarrierEligibleForDispatch(
      makeCarrier(),
      makeVerification({ outOfServiceDate: "2026-08-01" }),
      REQUIREMENTS,
      NOW
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("Carrier is out of service");
  });

  it("is ineligible for an Unsatisfactory safety rating", () => {
    const result = isCarrierEligibleForDispatch(
      makeCarrier(),
      makeVerification({ safetyRating: "Unsatisfactory" }),
      REQUIREMENTS,
      NOW
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("Carrier has an unsatisfactory safety rating");
  });

  it("is ineligible when authority is not active", () => {
    const result = isCarrierEligibleForDispatch(
      makeCarrier(),
      makeVerification({ authorityActive: false }),
      REQUIREMENTS,
      NOW
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("Carrier authority is not active");
  });

  it("is ineligible when insurance is not on file", () => {
    const result = isCarrierEligibleForDispatch(
      makeCarrier(),
      makeVerification({ insuranceOnFile: false }),
      REQUIREMENTS,
      NOW
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("Carrier has no insurance on file");
  });

  it("is ineligible when insurance expires within the 30-day window (boundary)", () => {
    const result = isCarrierEligibleForDispatch(
      makeCarrier({ insuranceExpiryDate: daysFromNow(30) }),
      makeVerification(),
      REQUIREMENTS,
      NOW
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("Carrier insurance is expiring within 30 days");
  });

  it("is eligible when insurance expires just past the 30-day window", () => {
    const result = isCarrierEligibleForDispatch(
      makeCarrier({ insuranceExpiryDate: daysFromNow(31) }),
      makeVerification(),
      REQUIREMENTS,
      NOW
    );

    expect(result).toEqual({ eligible: true, reasons: [] });
  });

  it("accumulates every applicable reason rather than short-circuiting on the first", () => {
    const result = isCarrierEligibleForDispatch(
      makeCarrier({
        isBlacklisted: true,
        blacklistReason: "Fraud",
        cargoCoverageLimit: 0,
        autoLiabilityLimit: 0,
      }),
      makeVerification({
        authorityActive: false,
        insuranceOnFile: false,
        outOfServiceDate: "2026-08-01",
        safetyRating: "Unsatisfactory",
      }),
      REQUIREMENTS,
      NOW
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toHaveLength(7);
  });
});
