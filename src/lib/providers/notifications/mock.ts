import type { NotificationProvider, NotificationSendInput, NotificationSendResult } from "./types";

// Deterministic offline stand-in for TelnyxSmsProvider, used whenever no
// TELNYX_API_KEY is configured (local dev, CI, tests) or when
// NOTIFICATION_PROVIDER=mock is set explicitly. Outcome is derived from the
// last digit of `to` (mirrors MockCarrierVerificationProvider's bucket
// pattern) so a test can pick a recipient number to get a stable
// success/failure result rather than a random one: an odd last digit
// succeeds, an even last digit fails.
export class MockNotificationProvider implements NotificationProvider {
  async send(input: NotificationSendInput): Promise<NotificationSendResult> {
    const digits = input.to.replace(/\D/g, "");

    if (digits.length === 0) {
      return {
        success: false,
        providerId: null,
        error: "Invalid recipient: no digits in phone number",
      };
    }

    const lastDigit = parseInt(digits.slice(-1), 10);
    const isSuccess = lastDigit % 2 === 1;

    if (isSuccess) {
      return {
        success: true,
        providerId: `mock-${digits}`,
        error: null,
      };
    }

    return {
      success: false,
      providerId: null,
      error: "Mock provider simulated delivery failure",
    };
  }
}
