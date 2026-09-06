// supabase/functions/ocr-extract/providers.ts
//
// Abstracts "call some OCR/document-intelligence engine" behind one
// interface so index.ts never talks to a specific vendor directly.
// GeminiOcrProvider is the only implementation today; a future provider
// (a different model, a dedicated OCR API) can be added and swapped in
// via getOcrProvider() without touching the handler.

import {
  getSchemaForDocumentType,
  type SupportedOcrDocumentType,
} from "./schemas.ts";

export interface OcrExtractedField {
  value: unknown;
  confidence: number;
}

export interface OcrExtractionInput {
  imageBytes: Uint8Array;
  mimeType: string;
  documentType: SupportedOcrDocumentType;
}

export interface OcrExtractionResult {
  fields: Record<string, OcrExtractedField>;
  rawResponse: unknown;
}

export interface OcrExtractionProvider {
  extract(input: OcrExtractionInput): Promise<OcrExtractionResult>;
}

const GEMINI_MODEL = "gemini-3.6-flash";

// Deno has no Buffer; encode in chunks so btoa doesn't blow the call
// stack on a multi-megabyte image (String.fromCharCode(...bigArray)
// would otherwise exceed the argument limit).
function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 0x8000;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    const chunk = bytes.subarray(offset, offset + CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export class GeminiOcrProvider implements OcrExtractionProvider {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extract(input: OcrExtractionInput): Promise<OcrExtractionResult> {
    const schema = getSchemaForDocumentType(input.documentType);
    const base64Data = bytesToBase64(input.imageBytes);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text:
                "You are extracting structured freight-document data from the attached image. " +
                "For every field, return your best reading as `value` (or null if the document " +
                "does not contain that field), and `confidence` as an integer 0-100 reflecting " +
                "how certain you are that `value` is correct. Never omit a field.",
            },
            {
              inline_data: {
                mime_type: input.mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
    } catch (networkError) {
      throw new Error(
        `Gemini request failed before a response was received: ${
          networkError instanceof Error ? networkError.message : String(networkError)
        }`
      );
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "<no body>");
      throw new Error(`Gemini API returned ${response.status}: ${detail}`);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (parseError) {
      throw new Error(
        `Gemini API response was not valid JSON: ${
          parseError instanceof Error ? parseError.message : String(parseError)
        }`
      );
    }

    const text = extractResponseText(payload);
    if (text === null) {
      throw new Error(
        `Gemini API response did not contain the expected candidates[0].content.parts[0].text shape: ${JSON.stringify(
          payload
        )}`
      );
    }

    let fields: Record<string, OcrExtractedField>;
    try {
      fields = JSON.parse(text);
    } catch (parseError) {
      throw new Error(
        `Gemini returned non-JSON structured output despite responseSchema: ${
          parseError instanceof Error ? parseError.message : String(parseError)
        }. Raw text: ${text}`
      );
    }

    if (typeof fields !== "object" || fields === null || Array.isArray(fields)) {
      throw new Error(
        `Gemini structured output was not a JSON object: ${text}`
      );
    }

    return { fields, rawResponse: payload };
  }
}

function extractResponseText(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  const content = (candidates[0] as { content?: unknown })?.content;
  if (typeof content !== "object" || content === null) return null;

  const parts = (content as { parts?: unknown }).parts;
  if (!Array.isArray(parts) || parts.length === 0) return null;

  const text = (parts[0] as { text?: unknown })?.text;
  return typeof text === "string" ? text : null;
}

export function getOcrProvider(): OcrExtractionProvider {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GeminiOcrProvider(apiKey);
}
