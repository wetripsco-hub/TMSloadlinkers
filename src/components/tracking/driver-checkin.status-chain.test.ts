import { describe, it, expect, vi } from "vitest";

// driver-checkin.tsx imports the "use server" actions module, which pulls in
// the Supabase server client (server-only). Stub it so this pure-logic test
// doesn't need a request/RSC context to import the module under test.
vi.mock("@/app/track/[token]/actions", () => ({
  submitAdvanceStatusAction: vi.fn(),
  submitTrackingPingAction: vi.fn(),
}));

// PodUpload itself imports another "use server" action (upload-tracking-document.ts)
// that pulls in the same server-only Supabase client -- stub it out too.
vi.mock("@/components/tracking/pod-upload", () => ({
  PodUpload: () => null,
}));

const { LOAD_STATUS_CHAIN, getNextChainStatus, getDriverNextAction } = await import("./driver-checkin");

describe("getNextChainStatus", () => {
  it("maps every status in the chain to its true next status, never skipping", () => {
    for (let i = 0; i < LOAD_STATUS_CHAIN.length - 1; i++) {
      expect(getNextChainStatus(LOAD_STATUS_CHAIN[i])).toBe(LOAD_STATUS_CHAIN[i + 1]);
    }
  });

  it("returns null for the terminal status", () => {
    expect(getNextChainStatus("settled")).toBeNull();
  });

  it("returns null for a status outside the forward chain (e.g. cancelled)", () => {
    expect(getNextChainStatus("cancelled")).toBeNull();
  });

  it("returns null for an unrecognized status", () => {
    expect(getNextChainStatus("not_a_real_status")).toBeNull();
  });
});

describe("getDriverNextAction", () => {
  it("offers no action from 'covered' -- dispatched is next, but a driver token cannot set it", () => {
    // covered -> dispatched is the true next chain status, but 'dispatched' is
    // outside the four driver-advanceable statuses (037_tracking_checkin.sql's
    // whitelist), so a driver must not be offered any button here -- this was
    // the actual bug: the UI previously always targeted "at_pickup" regardless
    // of whether the load had been dispatched yet.
    expect(getDriverNextAction("covered")).toBeNull();
  });

  it("offers 'at_pickup' from 'dispatched'", () => {
    expect(getDriverNextAction("dispatched")).toBe("at_pickup");
  });

  it("offers 'in_transit' from 'at_pickup'", () => {
    expect(getDriverNextAction("at_pickup")).toBe("in_transit");
  });

  it("offers 'at_delivery' from 'in_transit'", () => {
    expect(getDriverNextAction("in_transit")).toBe("at_delivery");
  });

  it("offers 'delivered' from 'at_delivery'", () => {
    expect(getDriverNextAction("at_delivery")).toBe("delivered");
  });

  it("offers no action from 'delivered' -- pod_uploaded is next, but it's not driver-settable", () => {
    expect(getDriverNextAction("delivered")).toBeNull();
  });

  it("offers no action from statuses before dispatch (quoted, posted_to_boards)", () => {
    expect(getDriverNextAction("quoted")).toBeNull();
    expect(getDriverNextAction("posted_to_boards")).toBeNull();
  });

  it("offers no action from statuses after delivery (pod_uploaded, invoiced, settled)", () => {
    expect(getDriverNextAction("pod_uploaded")).toBeNull();
    expect(getDriverNextAction("invoiced")).toBeNull();
    expect(getDriverNextAction("settled")).toBeNull();
  });

  it("offers no action for a cancelled load", () => {
    expect(getDriverNextAction("cancelled")).toBeNull();
  });

  it("never returns a target more than one legal chain step ahead of the current status", () => {
    for (const status of LOAD_STATUS_CHAIN) {
      const action = getDriverNextAction(status);
      if (action === null) continue;
      const currentIdx = LOAD_STATUS_CHAIN.indexOf(status);
      const targetIdx = LOAD_STATUS_CHAIN.indexOf(action);
      expect(targetIdx).toBe(currentIdx + 1);
    }
  });
});
