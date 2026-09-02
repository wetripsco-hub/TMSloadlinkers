import { describe, expect, it } from "vitest";

import { parseProofOfDelivery, parseRateConfirmation } from "../ocr-parser";

describe("parseRateConfirmation", () => {
  it("returns completed status with high confidence when all fields match", () => {
    const text = `
      Broker: Acme Logistics LLC
      MC#: 123456
      Rate: $2,450.00
      Origin: Dallas, TX
      Destination: Atlanta, GA
      Pickup: 2026-09-05T08:00:00Z
      Delivery: 2026-09-06T14:00:00Z
      Equipment: Dry Van
      Commodity: Electronics
      Weight: 12,000 lbs
    `;

    const result = parseRateConfirmation(text);

    expect(result.ocrStatus).toBe("completed");
    expect(result.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(result.extraction.brokerName).toEqual({ value: "Acme Logistics LLC", confidence: 92 });
    expect(result.extraction.brokerMcNumber.value).toBe("123456");
    expect(result.extraction.agreedRate.value).toBe(245000);
    expect(result.extraction.originCity.value).toBe("Dallas");
    expect(result.extraction.originState.value).toBe("TX");
    expect(result.extraction.destCity.value).toBe("Atlanta");
    expect(result.extraction.destState.value).toBe("GA");
    expect(result.extraction.weightLbs.value).toBe(12000);
  });

  it("flags review_required when a critical field like agreedRate or originState is missing", () => {
    const text = `
      Broker: Acme Logistics LLC
      Destination: Atlanta, GA
      Equipment: Dry Van
      Commodity: Electronics
    `;

    const result = parseRateConfirmation(text);

    expect(result.ocrStatus).toBe("review_required");
    expect(result.extraction.agreedRate.value).toBeNull();
    expect(result.extraction.agreedRate.confidence).toBeLessThan(80);
    expect(result.extraction.originCity.value).toBeNull();
    expect(result.extraction.originState.value).toBeNull();
  });

  it("flags review_required with zero confidence fields for a malformed document", () => {
    const text = "&#@!! unreadable garbage 0x00 %%% no structured content here";

    const result = parseRateConfirmation(text);

    expect(result.ocrStatus).toBe("review_required");
    expect(result.confidenceScore).toBe(0);
    expect(result.extraction.brokerName.value).toBeNull();
    expect(result.extraction.agreedRate.value).toBeNull();
    expect(Object.values(result.extraction).every((f) => f.value === null)).toBe(true);
  });

  it("accepts a Buffer as input", () => {
    const buffer = Buffer.from("Broker: Acme Logistics LLC\nRate: $1,000.00\nOrigin: Dallas, TX\nDestination: Atlanta, GA");

    const result = parseRateConfirmation(buffer);

    expect(result.extraction.brokerName.value).toBe("Acme Logistics LLC");
    expect(result.extraction.agreedRate.value).toBe(100000);
  });
});

describe("parseProofOfDelivery", () => {
  it("returns completed status with high confidence when critical fields match", () => {
    const text = `
      Signature: Yes
      Delivery Date/Time: 2026-09-06T14:32:00Z
      Pieces: 24
      Seal Number: SL-88213
      Exception Noted: No
      PO Number: PO-77621
    `;

    const result = parseProofOfDelivery(text);

    expect(result.ocrStatus).toBe("completed");
    expect(result.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(result.extraction.signatureDetected.value).toBe(true);
    expect(result.extraction.deliveryDateTime.value).not.toBeNull();
    expect(result.extraction.pieceCount.value).toBe(24);
    expect(result.extraction.sealNumber.value).toBe("SL-88213");
    expect(result.extraction.exceptionNoted.value).toBe(false);
    expect(result.extraction.poNumber.value).toBe("PO-77621");
  });

  it("flags review_required when critical fields signatureDetected/deliveryDateTime are missing", () => {
    const text = `
      Pieces: 5
      Seal Number: SL-00001
    `;

    const result = parseProofOfDelivery(text);

    expect(result.ocrStatus).toBe("review_required");
    expect(result.extraction.signatureDetected.value).toBeNull();
    expect(result.extraction.deliveryDateTime.value).toBeNull();
  });

  it("flags review_required with zero confidence fields for a malformed document", () => {
    const text = "!!! corrupted scan data ???";

    const result = parseProofOfDelivery(text);

    expect(result.ocrStatus).toBe("review_required");
    expect(result.confidenceScore).toBe(0);
    expect(Object.values(result.extraction).every((f) => f.value === null)).toBe(true);
  });
});
