import { describe, expect, it } from "vitest";

import { toCsv } from "../csv";

describe("toCsv", () => {
  it("renders a normal happy-path row with no quoting", () => {
    const result = toCsv(
      ["Carrier", "Total Loads", "On-Time %"],
      [["Acme Freight", 12, "83.33%"]]
    );

    expect(result).toBe("Carrier,Total Loads,On-Time %\r\nAcme Freight,12,83.33%");
  });

  it("quotes a field containing a comma", () => {
    const result = toCsv(["Customer"], [["Acme, Inc."]]);

    expect(result).toBe('Customer\r\n"Acme, Inc."');
  });

  it("quotes a field containing a double-quote and doubles it", () => {
    const result = toCsv(["Note"], [['Say "hello"']]);

    expect(result).toBe('Note\r\n"Say ""hello"""');
  });

  it("quotes a field containing a newline", () => {
    const result = toCsv(["Address"], [["123 Main St\nSuite 4"]]);

    expect(result).toBe('Address\r\n"123 Main St\nSuite 4"');
  });

  it("renders null as an empty string, never the literal text \"null\"", () => {
    const result = toCsv(["Value"], [[null]]);

    expect(result).toBe("Value\r\n");
    expect(result).not.toContain("null");
  });
});
