function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

export function calculateBrokerMargin(
  customerRateCents: number,
  carrierCostCents: number
): number {
  return customerRateCents - carrierCostCents;
}

export function calculateMarginPercent(
  marginCents: number,
  customerRateCents: number
): number {
  if (customerRateCents === 0) {
    throw new Error("Cannot calculate margin percent with zero customer rate");
  }

  return roundHalfAwayFromZero((marginCents / customerRateCents) * 10000) / 100;
}

export function calculateDispatcherCommission(
  grossPayCents: number,
  percentage: number
): number {
  return roundHalfAwayFromZero((grossPayCents * percentage) / 100);
}

export function calculateRatePerMile(rateCents: number, miles: number): number {
  if (miles <= 0) {
    throw new Error("Cannot calculate rate per mile with non-positive miles");
  }

  return roundHalfAwayFromZero(rateCents / miles);
}
