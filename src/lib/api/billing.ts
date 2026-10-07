import { apiRequest } from "../apiClient";
import { Envelope } from "./core";

// ---------------- Studio billing (plan/cadence) ----------------

export interface StudioBillingDTO {
  plan: "STANDARD" | "PREMIUM";
  cadence: "MONTHLY" | "YEARLY";
  billingMode: "SUBSCRIPTION" | "REVENUE_SHARE";
  commissionPercent: number;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  lapsed?: boolean;
}

export const studioBillingApi = {
  async get(): Promise<StudioBillingDTO> {
    const res = await apiRequest<Envelope<StudioBillingDTO>>("/studio/billing", {
      auth: true,
    });
    return res.data;
  },
  async startChange(input: {
    plan: "STANDARD" | "PREMIUM";
    cadence: "MONTHLY" | "YEARLY";
  }): Promise<{ reference: string; accessCode: string; publicKey: string }> {
    const res = await apiRequest<
      Envelope<{ reference: string; accessCode: string; publicKey: string }>
    >("/studio/billing/change", { method: "POST", auth: true, body: input });
    return res.data;
  },
  async applyChange(input: {
    reference: string;
    plan: "STANDARD" | "PREMIUM";
    cadence: "MONTHLY" | "YEARLY";
  }): Promise<StudioBillingDTO> {
    const res = await apiRequest<Envelope<StudioBillingDTO>>(
      "/studio/billing/apply",
      { method: "POST", auth: true, body: input },
    );
    return res.data;
  },
  // Manual renewal of the current plan (Mobile Money one-time charge).
  async startRenewal(): Promise<{
    reference: string;
    accessCode: string;
    publicKey: string;
  }> {
    const res = await apiRequest<
      Envelope<{ reference: string; accessCode: string; publicKey: string }>
    >("/studio/billing/renew", { method: "POST", auth: true });
    return res.data;
  },
  async applyRenewal(input: { reference: string }): Promise<StudioBillingDTO> {
    const res = await apiRequest<Envelope<StudioBillingDTO>>(
      "/studio/billing/renew/apply",
      { method: "POST", auth: true, body: input },
    );
    return res.data;
  },
};
