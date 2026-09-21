import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetLoadById = vi.fn();
vi.mock("@/lib/repositories/loads", () => ({
  getLoadById: (id: string) => mockGetLoadById(id),
}));

const mockSend = vi.fn();
const mockCreateNotificationProvider = vi.fn(() => ({ send: mockSend }));
vi.mock("@/lib/providers/notifications", () => ({
  createNotificationProvider: () => mockCreateNotificationProvider(),
}));

const { sendTrackingLink } = await import("./send-tracking-link");

function fakeLoad(driverPhone: string | null) {
  return {
    id: "39b03c91-b51f-4c1b-8e5e-354580688a7a",
    loadNumber: "L-000002",
    trackingToken: "7969350c-6051-429c-be1f-9648c6c94e09",
    driverPhone,
  };
}

// normalizePhoneNumber() is not exported (every export from a "use server"
// file must be an async Server Action), so its four required cases --
// parens+dashes, plain 10-digit, already-E.164, and a genuinely invalid
// number -- are covered here through sendTrackingLink()'s public behavior:
// the value actually handed to the provider, and the invalid case failing
// closed without ever calling the provider.
describe("sendTrackingLink", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.loadlinkers.com";
    mockGetLoadById.mockReset();
    mockSend.mockReset();
    mockCreateNotificationProvider.mockClear();
    mockSend.mockResolvedValue({ success: true, providerId: "mock-1", error: null });
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("sends the normalized parens+dashes number to the provider, not the raw stored value", async () => {
    mockGetLoadById.mockResolvedValue(fakeLoad("(555) 123-4561"));

    const result = await sendTrackingLink("39b03c91-b51f-4c1b-8e5e-354580688a7a");

    expect(result).toEqual({ success: true, error: null });
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0].to).toBe("+15551234561");
  });

  it("sends the normalized plain 10-digit number to the provider", async () => {
    mockGetLoadById.mockResolvedValue(fakeLoad("5551234561"));

    await sendTrackingLink("39b03c91-b51f-4c1b-8e5e-354580688a7a");

    expect(mockSend.mock.calls[0][0].to).toBe("+15551234561");
  });

  it("sends an already-E.164 number through unchanged", async () => {
    mockGetLoadById.mockResolvedValue(fakeLoad("+15551234561"));

    await sendTrackingLink("39b03c91-b51f-4c1b-8e5e-354580688a7a");

    expect(mockSend.mock.calls[0][0].to).toBe("+15551234561");
  });

  it("fails without calling the provider for a genuinely invalid number", async () => {
    mockGetLoadById.mockResolvedValue(fakeLoad("12345"));

    const result = await sendTrackingLink("39b03c91-b51f-4c1b-8e5e-354580688a7a");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/valid E\.164/);
    expect(mockSend).not.toHaveBeenCalled();
  });
});
