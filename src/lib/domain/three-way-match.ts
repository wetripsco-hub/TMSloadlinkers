import type { Cents } from "../../../types/domain";

export interface ThreeWayMatchOutcome {
  matched: boolean;
  discrepancies: string[];
}

export function performThreeWayMatch(
  rateConRate: Cents,
  invoiceRate: Cents,
  podVerified: boolean,
  toleranceCents: Cents
): ThreeWayMatchOutcome {
  const discrepancies: string[] = [];
  const variance = Math.abs(invoiceRate - rateConRate);

  if (variance > toleranceCents) {
    discrepancies.push(
      `Invoice rate differs from rate confirmation by ${variance} cents, exceeding tolerance of ${toleranceCents} cents`
    );
  }

  if (!podVerified) {
    discrepancies.push("Proof of delivery is not verified");
  }

  return {
    matched: discrepancies.length === 0,
    discrepancies,
  };
}
