// supabase/functions/ocr-extract/schemas.ts
//
// JSON schemas for Gemini's structured-output config (responseSchema /
// generationConfig.responseSchema), one per document type OCR supports.
// These mirror RateConExtraction and PodExtraction from types/domain.ts
// field-for-field -- if those interfaces change, update the matching
// schema here too, or the model's output will stop lining up with what
// the app expects to read back out of ocr_extracted_json.
//
// Gemini's Schema object uses its own (OpenAPI-subset) type strings --
// "OBJECT" / "STRING" / "NUMBER" / "BOOLEAN" -- not JSON Schema's
// lowercase ones, and has no "additionalProperties" keyword. Listing
// exactly the properties we want (nothing more) is the closest this
// format gets to "strict, no additional properties": the model is only
// given slots for the fields below, so there is nothing else for it to
// fill in.

export type GeminiFieldType = "STRING" | "NUMBER" | "BOOLEAN";

export interface GeminiOcrFieldSchema {
  type: "OBJECT";
  properties: {
    value: { type: GeminiFieldType; nullable: true };
    confidence: { type: "NUMBER"; description: string };
  };
  required: ["value", "confidence"];
}

function ocrField(valueType: GeminiFieldType): GeminiOcrFieldSchema {
  return {
    type: "OBJECT",
    properties: {
      value: { type: valueType, nullable: true },
      confidence: { type: "NUMBER", description: "0-100 confidence that value is correct." },
    },
    required: ["value", "confidence"],
  };
}

export interface GeminiDocumentSchema {
  type: "OBJECT";
  properties: Record<string, GeminiOcrFieldSchema>;
  required: string[];
}

// Matches RateConExtraction (types/domain.ts).
export const RATE_CONFIRMATION_SCHEMA: GeminiDocumentSchema = {
  type: "OBJECT",
  properties: {
    brokerName: ocrField("STRING"),
    brokerMcNumber: ocrField("STRING"),
    agreedRate: ocrField("NUMBER"), // Cents -- whole US cents, not dollars
    originCity: ocrField("STRING"),
    originState: ocrField("STRING"),
    destCity: ocrField("STRING"),
    destState: ocrField("STRING"),
    pickupWindowStart: ocrField("STRING"), // ISODateTime
    deliveryWindowStart: ocrField("STRING"), // ISODateTime
    equipmentType: ocrField("STRING"),
    commodity: ocrField("STRING"),
    weightLbs: ocrField("NUMBER"),
  },
  required: [
    "brokerName",
    "brokerMcNumber",
    "agreedRate",
    "originCity",
    "originState",
    "destCity",
    "destState",
    "pickupWindowStart",
    "deliveryWindowStart",
    "equipmentType",
    "commodity",
    "weightLbs",
  ],
};

// Matches PodExtraction (types/domain.ts).
export const POD_SCHEMA: GeminiDocumentSchema = {
  type: "OBJECT",
  properties: {
    signatureDetected: ocrField("BOOLEAN"),
    deliveryDateTime: ocrField("STRING"), // ISODateTime
    pieceCount: ocrField("NUMBER"),
    sealNumber: ocrField("STRING"),
    exceptionNoted: ocrField("BOOLEAN"),
    poNumber: ocrField("STRING"),
  },
  required: [
    "signatureDetected",
    "deliveryDateTime",
    "pieceCount",
    "sealNumber",
    "exceptionNoted",
    "poNumber",
  ],
};

export type SupportedOcrDocumentType = "RateConfirmation_Signed" | "POD";

export function getSchemaForDocumentType(
  documentType: SupportedOcrDocumentType
): GeminiDocumentSchema {
  switch (documentType) {
    case "RateConfirmation_Signed":
      return RATE_CONFIRMATION_SCHEMA;
    case "POD":
      return POD_SCHEMA;
  }
}
