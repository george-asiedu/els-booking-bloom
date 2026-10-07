export const CURRENCY = "GHS";

// Whole amounts stay whole ("GHS 150"); anything with pesewas shows both
// digits ("GHS 12.50", never "GHS 12.5" or float noise like "GHS 0.30000000000000004").
// The locale is pinned so a visitor's browser settings can't turn "1,500"
// into "1.500".
const whole = new Intl.NumberFormat("en-GH", { maximumFractionDigits: 0 });
const fractional = new Intl.NumberFormat("en-GH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatGHS = (amount: number): string => {
  const cents = Math.round(amount * 100);
  return `${CURRENCY} ${(cents % 100 === 0 ? whole : fractional).format(cents / 100)}`;
};
