import { describe, expect, it } from "vitest";
import { performThreeWayMatch } from "../three-way-match";

describe("performThreeWayMatch", () => {
  it("matches when rates are identical and POD is verified", () => {
    const result = performThreeWayMatch(150000, 150000, true, 0);
    expect(result).toEqual({ matched: true, discrepancies: [] });
  });

  it("matches when the rate difference is within tolerance", () => {
    const result = performThreeWayMatch(150000, 150500, true, 1000);
    expect(result).toEqual({ matched: true, discrepancies: [] });
  });

  it("flags a discrepancy when the rate difference exceeds tolerance", () => {
    const result = performThreeWayMatch(150000, 155000, true, 1000);
    expect(result.matched).toBe(false);
    expect(result.discrepancies).toEqual([
      "Invoice rate differs from rate confirmation by 5000 cents, exceeding tolerance of 1000 cents",
    ]);
  });

  it("flags a discrepancy when POD is not verified, even if rates match", () => {
    const result = performThreeWayMatch(150000, 150000, false, 0);
    expect(result.matched).toBe(false);
    expect(result.discrepancies).toEqual(["Proof of delivery is not verified"]);
  });

  it("reports both discrepancies when rate is out of tolerance and POD is unverified", () => {
    const result = performThreeWayMatch(150000, 160000, false, 500);
    expect(result.matched).toBe(false);
    expect(result.discrepancies).toHaveLength(2);
  });

  it("treats a negative invoice-to-rate-con difference the same as a positive one", () => {
    const result = performThreeWayMatch(150000, 140000, true, 1000);
    expect(result.matched).toBe(false);
    expect(result.discrepancies).toEqual([
      "Invoice rate differs from rate confirmation by 10000 cents, exceeding tolerance of 1000 cents",
    ]);
  });
});
