import { describe, expect, it } from "vitest";
import { addCents, formatCents, parseCents, subtractCents } from "./money";

describe("parseCents", () => {
  it("parses a plain dollar amount", () => {
    expect(parseCents("12.34")).toBe(1234);
  });

  it("parses whole dollars with no fraction", () => {
    expect(parseCents("5")).toBe(500);
  });

  it("parses zero", () => {
    expect(parseCents("0")).toBe(0);
    expect(parseCents("0.00")).toBe(0);
  });

  it("parses negative amounts", () => {
    expect(parseCents("-12.34")).toBe(-1234);
  });

  it("parses a single decimal digit as tenths of a dollar", () => {
    expect(parseCents("1.5")).toBe(150);
  });

  it("strips dollar signs and thousands separators", () => {
    expect(parseCents("$1,234.56")).toBe(123456);
  });

  it("throws on malformed input", () => {
    expect(() => parseCents("abc")).toThrow();
    expect(() => parseCents("12.345")).toThrow();
    expect(() => parseCents("")).toThrow();
  });
});

describe("formatCents", () => {
  it("formats a plain amount", () => {
    expect(formatCents(1234)).toBe("$12.34");
  });

  it("formats zero", () => {
    expect(formatCents(0)).toBe("$0.00");
  });

  it("formats negative amounts", () => {
    expect(formatCents(-1234)).toBe("-$12.34");
  });

  it("pads single-digit cents", () => {
    expect(formatCents(105)).toBe("$1.05");
  });

  it("adds thousands separators", () => {
    expect(formatCents(123456789)).toBe("$1,234,567.89");
  });

  it("throws on non-integer input", () => {
    expect(() => formatCents(12.5)).toThrow();
  });
});

describe("addCents / subtractCents", () => {
  it("adds without floating point drift", () => {
    expect(addCents(10, 20)).toBe(30);
    expect(addCents(parseCents("0.1"), parseCents("0.2"))).toBe(30);
  });

  it("subtracts without floating point drift", () => {
    expect(subtractCents(30, 10)).toBe(20);
  });

  it("handles negative results", () => {
    expect(subtractCents(10, 30)).toBe(-20);
  });

  it("handles zero operands", () => {
    expect(addCents(0, 0)).toBe(0);
    expect(subtractCents(0, 0)).toBe(0);
  });
});
