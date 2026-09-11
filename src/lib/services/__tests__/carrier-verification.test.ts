import { describe, expect, it, vi } from "vitest";

import {
  createCarrierVerificationProvider,
  FmcsaCarrierVerificationProvider,
  MockCarrierVerificationProvider,
  normalizeCarrierIdentifier,
  type FmcsaLookupCacheStore,
} from "../carrier-verification";

describe("MockCarrierVerificationProvider", () => {
  const provider = new MockCarrierVerificationProvider();

  it("returns Satisfactory for a DOT number landing in bucket 0", async () => {
    const result = await provider.verify({ dotNumber: "123456800" });

    expect(result.safetyRating).toBe("Satisfactory");
    expect(result.authorityActive).toBe(true);
    expect(result.insuranceOnFile).toBe(true);
    expect(result.outOfServiceDate).toBeNull();
    expect(result.source).toBe("mock");
    expect(result.raw).toMatchObject({ identifier: "123456800" });
  });

  it("returns Conditional for an MC number landing in bucket 1", async () => {
    const result = await provider.verify({ mcNumber: "654321" });

    expect(result.safetyRating).toBe("Conditional");
    expect(result.authorityActive).toBe(true);
    expect(result.insuranceOnFile).toBe(true);
  });

  it("returns Unsatisfactory with an out-of-service date for bucket 2", async () => {
    const result = await provider.verify({ dotNumber: "100002" });

    expect(result.safetyRating).toBe("Unsatisfactory");
    expect(result.authorityActive).toBe(true);
    expect(result.insuranceOnFile).toBe(false);
    expect(result.outOfServiceDate).not.toBeNull();
  });

  it("returns None with authority inactive for bucket 3", async () => {
    const result = await provider.verify({ dotNumber: "999999" });

    expect(result.safetyRating).toBe("None");
    expect(result.authorityActive).toBe(false);
  });

  it("falls back to an inert result when neither identifier is supplied", async () => {
    const result = await provider.verify({});

    expect(result.authorityActive).toBe(false);
    expect(result.safetyRating).toBe("None");
    expect(result.insuranceOnFile).toBe(false);
    expect(result.source).toBe("mock");
    expect(result.raw).toMatchObject({ error: "no_identifier_supplied" });
  });

  it("returns an inert result for a non-numeric identifier", async () => {
    const result = await provider.verify({ mcNumber: "ABC-INVALID" });

    expect(result.safetyRating).toBe("None");
    expect(result.authorityActive).toBe(false);
    expect(result.raw).toMatchObject({ error: "unrecognized_identifier" });
  });

  it("prefers dotNumber over mcNumber when both are supplied", async () => {
    const result = await provider.verify({ dotNumber: "123456800", mcNumber: "999999" });

    expect(result.safetyRating).toBe("Satisfactory");
  });
});

describe("FmcsaCarrierVerificationProvider", () => {
  it("maps a successful FMCSA response onto CarrierVerificationResult", async () => {
    const payload = {
      content: {
        carrier: {
          allowedToOperate: "Y",
          safetyRating: "S",
          oosDate: null,
          bipdInsuranceOnFile: "Y",
        },
      },
    };
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    });
    const provider = new FmcsaCarrierVerificationProvider("test-key", fetchImpl as unknown as typeof fetch);

    const result = await provider.verify({ dotNumber: "123456" });

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/carriers/123456?webKey=test-key")
    );
    expect(result).toMatchObject({
      authorityActive: true,
      safetyRating: "Satisfactory",
      insuranceOnFile: true,
      outOfServiceDate: null,
      source: "fmcsa",
    });
    expect(result.raw).toEqual(payload);
  });

  it("normalizes an unrecognized or missing safety rating to None", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: { carrier: { allowedToOperate: "N" } } }),
    });
    const provider = new FmcsaCarrierVerificationProvider("test-key", fetchImpl as unknown as typeof fetch);

    const result = await provider.verify({ mcNumber: "999999" });

    expect(result.safetyRating).toBe("None");
    expect(result.authorityActive).toBe(false);
    expect(result.insuranceOnFile).toBe(false);
  });

  it("throws when the FMCSA API responds with a non-ok status", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
    const provider = new FmcsaCarrierVerificationProvider("test-key", fetchImpl as unknown as typeof fetch);

    await expect(provider.verify({ dotNumber: "000000" })).rejects.toThrow(
      "FMCSA lookup failed with status 404"
    );
  });

  it("throws when neither identifier is supplied", async () => {
    const fetchImpl = vi.fn();
    const provider = new FmcsaCarrierVerificationProvider("test-key", fetchImpl as unknown as typeof fetch);

    await expect(provider.verify({})).rejects.toThrow("verify requires a dotNumber or mcNumber");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("FmcsaCarrierVerificationProvider caching", () => {
  function makeCacheStore(overrides: Partial<FmcsaLookupCacheStore> = {}): FmcsaLookupCacheStore {
    return {
      getFresh: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    };
  }

  it("returns the cached response with no fetch call on a cache hit", async () => {
    const cachedPayload = {
      content: {
        carrier: {
          allowedToOperate: "Y",
          safetyRating: "S",
          bipdInsuranceOnFile: "Y",
        },
      },
    };
    const cacheStore = makeCacheStore({
      getFresh: vi.fn().mockResolvedValue({ response: cachedPayload, fetchedAt: "2026-01-01T00:00:00.000Z" }),
    });
    const fetchImpl = vi.fn();
    const provider = new FmcsaCarrierVerificationProvider(
      "test-key",
      fetchImpl as unknown as typeof fetch,
      cacheStore
    );

    const result = await provider.verify({ dotNumber: "123456" });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(cacheStore.upsert).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      authorityActive: true,
      safetyRating: "Satisfactory",
      insuranceOnFile: true,
      source: "fmcsa",
      fetchedAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("fetches from FMCSA and upserts the cache on a cache miss", async () => {
    const payload = {
      content: {
        carrier: {
          allowedToOperate: "N",
          safetyRating: "U",
          bipdInsuranceOnFile: "N",
        },
      },
    };
    const cacheStore = makeCacheStore();
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    const provider = new FmcsaCarrierVerificationProvider(
      "test-key",
      fetchImpl as unknown as typeof fetch,
      cacheStore
    );

    const result = await provider.verify({ dotNumber: "999999" });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(cacheStore.upsert).toHaveBeenCalledTimes(1);
    expect(cacheStore.upsert).toHaveBeenCalledWith({ dotNumber: "999999" }, payload);
    expect(result).toMatchObject({
      authorityActive: false,
      safetyRating: "Unsatisfactory",
      insuranceOnFile: false,
      source: "fmcsa",
    });
  });

  it("still returns a successful lookup when the cache read throws", async () => {
    const payload = { content: { carrier: { allowedToOperate: "Y" } } };
    const cacheStore = makeCacheStore({
      getFresh: vi.fn().mockRejectedValue(new Error("db unavailable")),
    });
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    const provider = new FmcsaCarrierVerificationProvider(
      "test-key",
      fetchImpl as unknown as typeof fetch,
      cacheStore
    );

    const result = await provider.verify({ mcNumber: "654321" });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.authorityActive).toBe(true);
  });

  it("still returns a successful lookup when the cache write throws", async () => {
    const payload = { content: { carrier: { allowedToOperate: "Y" } } };
    const cacheStore = makeCacheStore({
      upsert: vi.fn().mockRejectedValue(new Error("db unavailable")),
    });
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    const provider = new FmcsaCarrierVerificationProvider(
      "test-key",
      fetchImpl as unknown as typeof fetch,
      cacheStore
    );

    const result = await provider.verify({ mcNumber: "654321" });

    expect(result.authorityActive).toBe(true);
  });
});

describe("normalizeCarrierIdentifier", () => {
  it("trims and strips non-digit characters so whitespace variants collapse to the same value", () => {
    expect(normalizeCarrierIdentifier("4468959")).toBe("4468959");
    expect(normalizeCarrierIdentifier(" 4468959 ")).toBe("4468959");
    expect(normalizeCarrierIdentifier("4468959")).toBe(normalizeCarrierIdentifier(" 4468959 "));
  });

  it("resolves whitespace-padded and clean identifiers to the same cache entry", () => {
    // Mirrors how defaultFmcsaLookupCacheStore keys rows in
    // fmcsa_lookup_cache: normalize, then look up/store by that value. A
    // trailing-space DOT number ("4468959 ", confirmed stored live before
    // this fix) must land on the same row as the clean "4468959".
    const cache = new Map<string, { source: string }>();
    const store = (rawDotNumber: string) => {
      const key = normalizeCarrierIdentifier(rawDotNumber);
      return key ? cache.get(key) : undefined;
    };
    const write = (rawDotNumber: string, entry: { source: string }) => {
      const key = normalizeCarrierIdentifier(rawDotNumber);
      if (key) cache.set(key, entry);
    };

    write("4468959", { source: "fmcsa" });

    expect(store(" 4468959 ")).toEqual({ source: "fmcsa" });
    expect(cache.size).toBe(1);
  });

  it("returns undefined for empty, whitespace-only, or missing input", () => {
    expect(normalizeCarrierIdentifier(undefined)).toBeUndefined();
    expect(normalizeCarrierIdentifier("")).toBeUndefined();
    expect(normalizeCarrierIdentifier("   ")).toBeUndefined();
  });
});

describe("createCarrierVerificationProvider", () => {
  it("returns the mock provider when no API key is configured", () => {
    const provider = createCarrierVerificationProvider(undefined);

    expect(provider).toBeInstanceOf(MockCarrierVerificationProvider);
  });

  it("returns the FMCSA provider when an API key is configured", () => {
    const provider = createCarrierVerificationProvider("a-real-key");

    expect(provider).toBeInstanceOf(FmcsaCarrierVerificationProvider);
  });
});
