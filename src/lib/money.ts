const CENTS_PATTERN = /^-?\d+(\.\d{1,2})?$/;

export function parseCents(input: string): number {
  const trimmed = input.trim().replace(/[$,]/g, "");

  if (!CENTS_PATTERN.test(trimmed)) {
    throw new Error(`Invalid money string: "${input}"`);
  }

  const [wholePart, fractionPart = ""] = trimmed.split(".");
  const paddedFraction = fractionPart.padEnd(2, "0");
  const sign = wholePart.startsWith("-") ? -1 : 1;
  const absWhole = Math.abs(Number(wholePart));

  return sign * (absWhole * 100 + Number(paddedFraction));
}

export function formatCents(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error(`formatCents requires an integer cent amount, got ${cents}`);
  }

  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.trunc(abs / 100);
  const fraction = (abs % 100).toString().padStart(2, "0");

  return `${sign}$${whole.toLocaleString("en-US")}.${fraction}`;
}

export function addCents(a: number, b: number): number {
  return a + b;
}

export function subtractCents(a: number, b: number): number {
  return a - b;
}
