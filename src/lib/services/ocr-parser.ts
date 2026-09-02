import type {
  Cents,
  OcrField,
  OcrStatus,
  PodExtraction,
  RateConExtraction,
} from "../../../types/domain";

export interface OcrParseResult<T> {
  extraction: T;
  confidenceScore: number;
  ocrStatus: OcrStatus;
}

const NO_MATCH_CONFIDENCE = 0;
const MATCH_CONFIDENCE = 92;
const REVIEW_THRESHOLD = 80;

function field<T>(value: T | null): OcrField<T> {
  return { value, confidence: value === null ? NO_MATCH_CONFIDENCE : MATCH_CONFIDENCE };
}

function match(text: string, pattern: RegExp): string | null {
  const result = pattern.exec(text);
  return result?.[1]?.trim() || null;
}

function toDollarsCents(raw: string | null): Cents | null {
  if (!raw) return null;
  const numeric = Number(raw.replace(/,/g, ""));
  return Number.isFinite(numeric) ? Math.round(numeric * 100) : null;
}

function toNumber(raw: string | null): number | null {
  if (!raw) return null;
  const numeric = Number(raw.replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function toIsoDateTime(raw: string | null): string | null {
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toBoolean(raw: string | null): boolean | null {
  if (!raw) return null;
  return /^(yes|true|y)$/i.test(raw);
}

function bufferOrTextToString(fileBufferOrText: Buffer | string): string {
  return typeof fileBufferOrText === "string"
    ? fileBufferOrText
    : fileBufferOrText.toString("utf-8");
}

function aggregateOutcome(
  allFields: OcrField<unknown>[],
  criticalFields: OcrField<unknown>[]
): { confidenceScore: number; ocrStatus: OcrStatus } {
  const confidenceScore = allFields.length
    ? Math.round(allFields.reduce((sum, f) => sum + f.confidence, 0) / allFields.length)
    : 0;

  const hasCriticalReview = criticalFields.some((f) => f.confidence < REVIEW_THRESHOLD);

  return {
    confidenceScore,
    ocrStatus: hasCriticalReview ? "review_required" : "completed",
  };
}

// Heuristic/mock parser: matches labeled lines with regex rather than running
// real OCR/ML extraction, so it works locally and in tests without an
// external OCR provider. A production integration would swap the matcher
// functions below for a real document-intelligence call while keeping the
// OcrField/confidence-aggregation contract the same.
export function parseRateConfirmation(fileBufferOrText: Buffer | string): OcrParseResult<RateConExtraction> {
  const text = bufferOrTextToString(fileBufferOrText);

  const brokerName = field(match(text, /Broker(?:\s*Name)?\s*[:\-]\s*(.+)/i));
  const brokerMcNumber = field(match(text, /MC\s*#?\s*[:\-]?\s*(\d{3,8})/i));
  const agreedRate = field(toDollarsCents(match(text, /(?:Rate|Agreed\s*Rate)\s*[:\-]\s*\$?\s*([\d,]+(?:\.\d{1,2})?)/i)));
  const originCity = field(match(text, /Origin\s*[:\-]\s*([A-Za-z .'-]+?)\s*,/i));
  const originState = field(match(text, /Origin\s*[:\-]\s*[A-Za-z .'-]+?\s*,\s*([A-Z]{2})/i));
  const destCity = field(match(text, /Dest(?:ination)?\s*[:\-]\s*([A-Za-z .'-]+?)\s*,/i));
  const destState = field(match(text, /Dest(?:ination)?\s*[:\-]\s*[A-Za-z .'-]+?\s*,\s*([A-Z]{2})/i));
  const pickupWindowStart = field(toIsoDateTime(match(text, /Pickup(?:\s*Window)?\s*[:\-]\s*(.+)/i)));
  const deliveryWindowStart = field(toIsoDateTime(match(text, /Delivery(?:\s*Window)?\s*[:\-]\s*(.+)/i)));
  const equipmentType = field(match(text, /Equipment\s*[:\-]\s*(.+)/i));
  const commodity = field(match(text, /Commodity\s*[:\-]\s*(.+)/i));
  const weightLbs = field(toNumber(match(text, /Weight\s*[:\-]\s*([\d,]+)\s*(?:lbs)?/i)));

  const extraction: RateConExtraction = {
    brokerName,
    brokerMcNumber,
    agreedRate,
    originCity,
    originState,
    destCity,
    destState,
    pickupWindowStart,
    deliveryWindowStart,
    equipmentType,
    commodity,
    weightLbs,
  };

  const criticalFields = [brokerName, agreedRate, originCity, originState, destCity, destState];
  const { confidenceScore, ocrStatus } = aggregateOutcome(Object.values(extraction), criticalFields);

  return { extraction, confidenceScore, ocrStatus };
}

export function parseProofOfDelivery(fileBufferOrText: Buffer | string): OcrParseResult<PodExtraction> {
  const text = bufferOrTextToString(fileBufferOrText);

  const signatureDetected = field(toBoolean(match(text, /Signature\s*[:\-]\s*(\w+)/i)));
  const deliveryDateTime = field(toIsoDateTime(match(text, /Delivery(?:\s*Date(?:\/Time)?)?\s*[:\-]\s*(.+)/i)));
  const pieceCount = field(toNumber(match(text, /Piece(?:s|\s*Count)?\s*[:\-]\s*([\d,]+)/i)));
  const sealNumber = field(match(text, /Seal\s*(?:#|Number)?\s*[:\-]\s*([\w-]+)/i));
  const exceptionNoted = field(toBoolean(match(text, /Exception\s*(?:Noted)?\s*[:\-]\s*(\w+)/i)));
  const poNumber = field(match(text, /PO\s*(?:#|Number)?\s*[:\-]\s*([\w-]+)/i));

  const extraction: PodExtraction = {
    signatureDetected,
    deliveryDateTime,
    pieceCount,
    sealNumber,
    exceptionNoted,
    poNumber,
  };

  const criticalFields = [signatureDetected, deliveryDateTime];
  const { confidenceScore, ocrStatus } = aggregateOutcome(Object.values(extraction), criticalFields);

  return { extraction, confidenceScore, ocrStatus };
}
