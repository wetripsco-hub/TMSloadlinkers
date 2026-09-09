import "server-only";
import type { NotificationProvider, NotificationSendInput, NotificationSendResult } from "./types";

const TELNYX_MESSAGES_URL = "https://api.telnyx.com/v2/messages";

interface TelnyxMessageResponse {
  data?: {
    id?: string;
  };
}

interface TelnyxErrorResponse {
  errors?: Array<{ code?: string; title?: string; detail?: string }>;
}

// Sends SMS via Telnyx's v2 Messages REST API directly with fetch -- no SDK,
// none was already a dependency. See
// https://developers.telnyx.com/docs/messaging/messages/send-message
export class TelnyxSmsProvider implements NotificationProvider {
  constructor(
    private readonly apiKey: string,
    private readonly fromNumber: string,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  async send(input: NotificationSendInput): Promise<NotificationSendResult> {
    const response = await this.fetchImpl(TELNYX_MESSAGES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        from: this.fromNumber,
        to: input.to,
        text: input.message,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as TelnyxErrorResponse | null;
      const detail = payload?.errors?.[0]?.detail ?? payload?.errors?.[0]?.title;
      return {
        success: false,
        providerId: null,
        error: detail ?? `Telnyx request failed with status ${response.status}`,
      };
    }

    const payload = (await response.json()) as TelnyxMessageResponse;

    return {
      success: true,
      providerId: payload.data?.id ?? null,
      error: null,
    };
  }
}
