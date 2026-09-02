import { describe, expect, it } from "vitest";
import {
  calculateBrokerMargin,
  calculateDispatcherCommission,
  calculateMarginPercent,
  calculateRatePerMile,
} from "./margin";

describe("calculateBrokerMargin", () => {
  it("returns the difference between customer rate and carrier cost", () => {
    expect(calculateBrokerMargin(200000, 175000)).toBe(25000);
  });

  it("returns zero when rate equals cost", () => {
    expect(calculateBrokerMargin(150000, 150000)).toBe(0);
  });

  it("returns a negative margin when carrier cost exceeds customer rate", () => {
    expect(calculateBrokerMargin(150000, 175000)).toBe(-25000);
  });
});

describe("calculateMarginPercent", () => {
  it("computes a simple percentage", () => {
    expect(calculateMarginPercent(25000, 200000)).toBe(12.5);
  });

  it("returns zero for zero margin", () => {
    expect(calculateMarginPercent(0, 200000)).toBe(0);
  });

  it("handles negative margin", () => {
    expect(calculateMarginPercent(-25000, 200000)).toBe(-12.5);
  });

  it("rounds half-away-from-zero at the two-decimal boundary", () => {
    expect(calculateMarginPercent(1, 3)).toBe(33.33);
    expect(calculateMarginPercent(1, 8)).toBe(12.5);
    expect(calculateMarginPercent(125, 10000)).toBe(1.25);
  });

  it("throws when customer rate is zero", () => {
    expect(() => calculateMarginPercent(0, 0)).toThrow();
  });
});

describe("calculateDispatcherCommission", () => {
  it("computes a simple commission", () => {
    expect(calculateDispatcherCommission(100000, 10)).toBe(10000);
  });

  it("returns zero for zero gross pay", () => {
    expect(calculateDispatcherCommission(0, 10)).toBe(0);
  });

  it("returns zero for zero percentage", () => {
    expect(calculateDispatcherCommission(100000, 0)).toBe(0);
  });

  it("rounds half-away-from-zero at the whole-cent boundary", () => {
    expect(calculateDispatcherCommission(101, 50)).toBe(51);
    expect(calculateDispatcherCommission(99, 50)).toBe(50);
  });

  it("handles a negative gross pay (chargeback) consistently", () => {
    expect(calculateDispatcherCommission(-101, 50)).toBe(-51);
  });
});

describe("calculateRatePerMile", () => {
  it("computes a simple per-mile rate", () => {
    expect(calculateRatePerMile(200000, 1000)).toBe(200);
  });

  it("rounds half-away-from-zero at the whole-cent boundary", () => {
    expect(calculateRatePerMile(101, 2)).toBe(51);
    expect(calculateRatePerMile(99, 2)).toBe(50);
  });

  it("handles a zero-cent rate", () => {
    expect(calculateRatePerMile(0, 500)).toBe(0);
  });

  it("throws for zero miles", () => {
    expect(() => calculateRatePerMile(100000, 0)).toThrow();
  });

  it("throws for negative miles", () => {
    expect(() => calculateRatePerMile(100000, -10)).toThrow();
  });
});
