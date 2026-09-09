import "server-only";
import type { NotificationProvider } from "./types";
import { MockNotificationProvider } from "./mock";
import { TelnyxSmsProvider } from "./telnyx";

export type { NotificationProvider, NotificationSendInput, NotificationSendResult } from "./types";
export { MockNotificationProvider } from "./mock";
export { TelnyxSmsProvider } from "./telnyx";

// Selects the provider via NOTIFICATION_PROVIDER, defaulting to mock when
// unset (local dev, CI). Unlike createCarrierVerificationProvider (which
// infers real-vs-mock from whether an API key is present), this reads an
// explicit provider name so switching providers doesn't depend on which env
// vars happen to be set -- picking "telnyx" without its required vars is a
// misconfiguration and must fail loudly, not silently fall back to mock.
export function createNotificationProvider(
  provider: string | undefined = process.env.NOTIFICATION_PROVIDER
): NotificationProvider {
  const selected = provider ?? "mock";

  switch (selected) {
    case "mock":
      return new MockNotificationProvider();

    case "telnyx": {
      const apiKey = process.env.TELNYX_API_KEY;
      const fromNumber = process.env.TELNYX_FROM_NUMBER;

      if (!apiKey) {
        throw new Error('NOTIFICATION_PROVIDER=telnyx but TELNYX_API_KEY is not set');
      }
      if (!fromNumber) {
        throw new Error('NOTIFICATION_PROVIDER=telnyx but TELNYX_FROM_NUMBER is not set');
      }

      return new TelnyxSmsProvider(apiKey, fromNumber);
    }

    default:
      throw new Error(`Unknown NOTIFICATION_PROVIDER "${selected}"`);
  }
}
