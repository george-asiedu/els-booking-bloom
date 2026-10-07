import type { ServiceDTO } from "@/lib/api";

// Loyalty: 10 points = GHS 1 off, capped at the studio's loyalty cap %.
export const POINTS_PER_GHS = 10;

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface BookingPricingInput {
  service: ServiceDTO | undefined;
  signedIn: boolean;
  availablePoints: number;
  loyaltyCapPercent: number;
  applyPoints: boolean;
  paymentEnabled: boolean;
  paymentMethod: "full" | "partial";
  depositPercent: number;
  productSubtotal: number;
}

/**
 * Everything the booking summary shows, derived in one place so the numbers
 * on screen and the button label can't disagree. Mirrors the server's rules:
 * points can't combine with a promo price, and are capped at a share of the
 * service price.
 */
export const computeBookingPricing = (i: BookingPricingInput) => {
  const onPromo = i.service?.on_promo ?? false;
  const servicePrice = i.service?.effective_price ?? 0;

  const maxPointsByCap = Math.floor(
    servicePrice * (i.loyaltyCapPercent / 100) * POINTS_PER_GHS,
  );
  const pointsToUse = Math.min(i.availablePoints, maxPointsByCap);
  const discount = pointsToUse / POINTS_PER_GHS;
  const canUsePoints =
    i.signedIn && i.availablePoints > 0 && discount > 0 && !onPromo;
  const effectiveApplyPoints = i.applyPoints && canUsePoints;
  const amountDue = round2(servicePrice - (effectiveApplyPoints ? discount : 0));

  const depositAmount = round2(amountDue * (i.depositPercent / 100));
  const payNowAmount = i.paymentMethod === "partial" ? depositAmount : amountDue;
  const balanceAfterDeposit = round2(Math.max(0, amountDue - depositAmount));
  // Charged now when products are added: the service share plus products.
  const bookingPayNow = round2(
    (i.paymentEnabled ? payNowAmount : 0) + i.productSubtotal,
  );

  return {
    onPromo,
    servicePrice,
    pointsToUse,
    discount,
    canUsePoints,
    effectiveApplyPoints,
    amountDue,
    depositAmount,
    payNowAmount,
    balanceAfterDeposit,
    bookingPayNow,
  };
};

export type BookingPricing = ReturnType<typeof computeBookingPricing>;
