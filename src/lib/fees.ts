// The Paystack fee a customer pays on top of the price when the business has
// them pay it. Mirrors the server (ELS-Server dbConnection.paystackChargeFor):
// the total is grossed up so that after Paystack's percentage the business
// still receives the full price.
export const processingFeeFor = (
  base: number,
  settings: { customerPaysFee?: boolean; processingFeePercent?: number } | undefined,
): number => {
  if (!settings?.customerPaysFee || base <= 0) return 0;
  const rate = (settings.processingFeePercent ?? 1.95) / 100;
  const basePesewas = Math.round(base * 100);
  return (Math.ceil(basePesewas / (1 - rate)) - basePesewas) / 100;
};
