import { describe, it, expect } from "vitest";
import { computeStopLateness, formatLatenessDuration } from "./timeline-helpers";

describe("computeStopLateness", () => {
  it("returns null when there is no scheduled window", () => {
    expect(computeStopLateness(null, null, new Date("2026-01-01T12:00:00Z"))).toBeNull();
  });

  it("is not late when now is before the window end and the stop has not arrived", () => {
    const result = computeStopLateness(
      "2026-01-01T12:00:00Z",
      null,
      new Date("2026-01-01T11:00:00Z")
    );
    expect(result).toEqual({ isLate: false, durationMs: 0 });
  });

  it("is late when now is past the window end and the stop has not arrived yet", () => {
    const result = computeStopLateness(
      "2026-01-01T12:00:00Z",
      null,
      new Date("2026-01-01T13:30:00Z")
    );
    expect(result).toEqual({ isLate: true, durationMs: 90 * 60000 });
  });

  it("is not late when the stop arrived before the window end", () => {
    const result = computeStopLateness(
      "2026-01-01T12:00:00Z",
      "2026-01-01T11:45:00Z",
      new Date("2026-01-01T15:00:00Z")
    );
    expect(result).toEqual({ isLate: false, durationMs: 0 });
  });

  it("is late using the arrival time, not now, once the stop has arrived", () => {
    const result = computeStopLateness(
      "2026-01-01T12:00:00Z",
      "2026-01-01T12:20:00Z",
      new Date("2026-01-01T18:00:00Z")
    );
    expect(result).toEqual({ isLate: true, durationMs: 20 * 60000 });
  });

  it("treats an arrival exactly at the window end as not late", () => {
    const result = computeStopLateness(
      "2026-01-01T12:00:00Z",
      "2026-01-01T12:00:00Z",
      new Date("2026-01-01T18:00:00Z")
    );
    expect(result).toEqual({ isLate: false, durationMs: 0 });
  });
});

describe("formatLatenessDuration", () => {
  it("formats sub-hour durations in minutes", () => {
    expect(formatLatenessDuration(45 * 60000)).toBe("45m late");
  });

  it("formats exact-hour durations without minutes", () => {
    expect(formatLatenessDuration(2 * 3600000)).toBe("2h late");
  });

  it("formats mixed hour and minute durations", () => {
    expect(formatLatenessDuration(2 * 3600000 + 15 * 60000)).toBe("2h 15m late");
  });

  it("rounds down to the nearest minute", () => {
    expect(formatLatenessDuration(59_000)).toBe("0m late");
  });
});
