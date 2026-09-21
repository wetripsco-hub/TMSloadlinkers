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
    authorityStatus: "A",
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
  it("returns verified when authority status is A and the carrier has been verified", () => {
    expect(deriveComplianceBadge(makeCarrier(), makeVerification(), NOW)).toBe("verified");
  });

  it("returns blocked when the carrier is blacklisted, regardless of a clean verification", () => {
    expect(
      deriveComplianceBadge(makeCarrier({ isBlacklisted: true }), makeVerification(), NOW)
    ).toBe("blocked");
  });

  it("returns blocked when authority status is I (inactive, seen live from FMCSA)", () => {
    expect(
      deriveComplianceBadge(makeCarrier(), makeVerification({ authorityStatus: "I" }), NOW)
    ).toBe("blocked");
  });

  it("returns expiring for a never-verified carrier with insurance expiring soon (BUG 1: insurance and FMCSA signals are independent, insurance is not masked by unverified)", () => {
    expect(
      deriveComplianceBadge(
        makeCarrier({ lastVerifiedAt: null, insuranceExpiryDate: daysFromNow(5) }),
        makeVerification(),
        NOW
      )
    ).toBe("expiring");
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

  it("returns blocked when insurance already lapsed (BUG 1: a past expiry date is a stronger signal than 'expiring soon')", () => {
    expect(
      deriveComplianceBadge(
        makeCarrier({ insuranceExpiryDate: daysFromNow(-5) }),
        makeVerification(),
        NOW
      )
    ).toBe("blocked");
  });

  it("returns unverified when the carrier has never been verified (lastVerifiedAt null)", () => {
    expect(
      deriveComplianceBadge(makeCarrier({ lastVerifiedAt: null }), makeVerification(), NOW)
    ).toBe("unverified");
  });

  it("does not treat a never-verified carrier's placeholder authority status as blocked", () => {
    // mapRowToCarrier()'s fallback for an unverified carrier: authorityStatus
    // "unknown", lastVerifiedAt null. Must fall through to unverified, not blocked.
    expect(
      deriveComplianceBadge(
        makeCarrier({ authorityStatus: "unknown", lastVerifiedAt: null }),
        makeVerification({ authorityStatus: null }),
        NOW
      )
    ).toBe("unverified");
  });

  it("treats authority status comparisons as case-insensitive", () => {
    expect(
      deriveComplianceBadge(makeCarrier(), makeVerification({ authorityStatus: "a" }), NOW)
    ).toBe("verified");
    expect(
      deriveComplianceBadge(makeCarrier(), makeVerification({ authorityStatus: "i" }), NOW)
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

  it("is ineligible with a distinct reason when insurance has already lapsed (BUG 1: not the same reason text as 'expiring soon')", () => {
    const result = isCarrierEligibleForDispatch(
      makeCarrier({ insuranceExpiryDate: daysFromNow(-5) }),
      makeVerification(),
      REQUIREMENTS,
      NOW
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("Carrier insurance has expired");
    expect(result.reasons).not.toContain("Carrier insurance is expiring within 30 days");
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
