export function buildGoogleMapsNavigationUrl(originAddress: string, destinationAddress: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originAddress)}&destination=${encodeURIComponent(destinationAddress)}&travelmode=driving`;
}
