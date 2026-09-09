import { describe, it, expect } from "vitest";
import { buildTrackingLinkMessage } from "./tracking-link-message";

describe("buildTrackingLinkMessage", () => {
  it("includes the load number and the full tracking URL", () => {
    const message = buildTrackingLinkMessage(
      "L-000042",
      "7969350c-6051-429c-be1f-9648c6c94e09",
      "https://app.loadlinkers.com"
    );

    expect(message).toContain("L-000042");
    expect(message).toContain(
      "https://app.loadlinkers.com/track/7969350c-6051-429c-be1f-9648c6c94e09"
    );
  });

  it("strips a trailing slash from the base URL so the path does not double up", () => {
    const message = buildTrackingLinkMessage(
      "L-000042",
      "7969350c-6051-429c-be1f-9648c6c94e09",
      "https://app.loadlinkers.com/"
    );

    expect(message).toContain(
      "https://app.loadlinkers.com/track/7969350c-6051-429c-be1f-9648c6c94e09"
    );
    expect(message).not.toContain("//track/");
  });

  it("is short enough to fit comfortably in a single SMS segment", () => {
    const message = buildTrackingLinkMessage(
      "L-000042",
      "7969350c-6051-429c-be1f-9648c6c94e09",
      "https://app.loadlinkers.com"
    );

    expect(message.length).toBeLessThanOrEqual(160);
  });

  it("works with a localhost base URL for local dev", () => {
    const message = buildTrackingLinkMessage(
      "L-000001",
      "abc-123",
      "http://localhost:3000"
    );

    expect(message).toContain("http://localhost:3000/track/abc-123");
  });
});
