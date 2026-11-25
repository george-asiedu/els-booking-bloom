import { apiRequest } from "../apiClient";
import { Envelope } from "./core";

// ---------------- Studio billing (plan/cadence) ----------------

export interface StudioBillingDTO {
  plan: "STANDARD" | "PREMIUM" | "STOREFRONT";
  cadence: "MONTHLY" | "YEARLY";
  billingMode: "SUBSCRIPTION" | "REVENUE_SHARE";
  commissionPercent: number;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  lapsed?: boolean;
  // What this account pays per period for each plan (its own price/discount).
  yourPrices?: Record<"STANDARD" | "PREMIUM" | "STOREFRONT", Record<"MONTHLY" | "YEARLY", number>>;
  /** Charges on top of the plan (feature request fees, extra storage, training), added to the next renewal. */
  extras?: { items: { id: string; kind: string; description: string; amount: number }[]; total: number };
  discountPercent?: number;
  discountEndsAt?: string | null;
  // A suspended account pays this on top of its plan to come back.
  suspended?: boolean;
  reactivationFee?: number;
  // Only on the reply to a renewal: what was just paid for.
  renewal?: RenewalReceiptDTO | null;
}

export interface RenewalReceiptDTO {
  reference: string;
  plan: "STANDARD" | "PREMIUM" | "STOREFRONT";
  cadence: "MONTHLY" | "YEARLY";
  amount: number;
  currency: string;
  paidAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  // True: the plan had lapsed and this brought the studio back. Null when
  // the payment had already been applied (e.g. by the webhook) first.
  wasLapsed: boolean | null;
}

export const studioBillingApi = {
  async get(): Promise<StudioBillingDTO> {
    const res = await apiRequest<Envelope<StudioBillingDTO>>("/studio/billing", {
      auth: true,
    });
    return res.data;
  },
  async startChange(input: {
    plan: "STANDARD" | "PREMIUM" | "STOREFRONT";
    cadence: "MONTHLY" | "YEARLY";
    promoCode?: string;
  }): Promise<{ reference: string; accessCode: string; publicKey: string }> {
    const res = await apiRequest<
      Envelope<{ reference: string; accessCode: string; publicKey: string }>
    >("/studio/billing/change", { method: "POST", auth: true, body: input });
    return res.data;
  },
  async applyChange(input: {
    reference: string;
    plan: "STANDARD" | "PREMIUM" | "STOREFRONT";
    cadence: "MONTHLY" | "YEARLY";
  }): Promise<StudioBillingDTO> {
    const res = await apiRequest<Envelope<StudioBillingDTO>>(
      "/studio/billing/apply",
      { method: "POST", auth: true, body: input },
    );
    return res.data;
  },
  // Manual renewal of the current plan (Mobile Money one-time charge).
  async startRenewal(promoCode?: string): Promise<{
    reference: string;
    accessCode: string;
    publicKey: string;
  }> {
    const res = await apiRequest<
      Envelope<{ reference: string; accessCode: string; publicKey: string }>
    >("/studio/billing/renew", { method: "POST", auth: true, body: { promoCode } });
    return res.data;
  },
  async applyRenewal(input: { reference: string }): Promise<StudioBillingDTO> {
    const res = await apiRequest<Envelope<StudioBillingDTO>>(
      "/studio/billing/renew/apply",
      { method: "POST", auth: true, body: input },
    );
    return res.data;
  },
  // Pay what's owed on top of the plan now, instead of at the next renewal.
  async startExtrasPayment(): Promise<{ reference: string; accessCode: string; publicKey: string }> {
    const res = await apiRequest<Envelope<{ reference: string; accessCode: string; publicKey: string }>>(
      "/studio/billing/extras",
      { method: "POST", auth: true },
    );
    return res.data;
  },
  async applyExtrasPayment(input: { reference: string }): Promise<StudioBillingDTO> {
    const res = await apiRequest<Envelope<StudioBillingDTO>>("/studio/billing/extras/apply", {
      method: "POST",
      auth: true,
      body: input,
    });
    return res.data;
  },
};
