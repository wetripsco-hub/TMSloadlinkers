export function buildTrackingLinkMessage(
  loadNumber: string,
  trackingToken: string,
  baseUrl: string
): string {
  const trimmedBaseUrl = baseUrl.replace(/\/+$/, "");
  const trackingUrl = `${trimmedBaseUrl}/track/${trackingToken}`;

  return `Load ${loadNumber}: tap to check in and share your status: ${trackingUrl}`;
}
