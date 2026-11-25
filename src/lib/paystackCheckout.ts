import PaystackPop from "@paystack/inline-js";

// Paystack's inline popup as a promise, so a payment flow reads top to bottom
// (start -> pay -> apply) instead of nesting callbacks. Resolves "paid" or
// "cancelled"; rejects when Paystack reports an error.

export type CheckoutResult = "paid" | "cancelled";

export class PaystackCheckoutError extends Error {}

export const openPaystackCheckout = (accessCode: string): Promise<CheckoutResult> =>
  new Promise((resolve, reject) => {
    new PaystackPop().resumeTransaction(accessCode, {
      onSuccess: () => resolve("paid"),
      onCancel: () => resolve("cancelled"),
      onError: (e: { message?: string }) =>
        reject(new PaystackCheckoutError(e?.message || "Payment failed")),
    });
  });
