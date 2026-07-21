export const CURRENCY = "GHS";

export const formatGHS = (amount: number): string =>
  `${CURRENCY} ${amount.toLocaleString()}`;
