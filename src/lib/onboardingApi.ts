import { apiRequest } from "./apiClient";

interface Envelope<T> {
  message: string;
  data: T;
}

export type Plan = "STANDARD" | "PREMIUM";
export type Cadence = "MONTHLY" | "YEARLY";
export type BillingMode = "SUBSCRIPTION" | "REVENUE_SHARE";

export interface OnboardingConfig {
  revenueShareEnabled: boolean;
  commissionStandardPercent: number;
  commissionPremiumPercent: number;
  setupFeeStandard: number;
  setupFeePremium: number;
}

export interface OnboardingStartInput {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerFullName?: string;
  plan: Plan;
  cadence: Cadence;
  billingMode: BillingMode;
}

export interface OnboardingStartResult {
  reference: string;
  accessCode?: string;
  authorizationUrl?: string;
  email: string;
  publicKey?: string;
  // Set when a free (no-setup-fee) revenue-share signup provisions immediately.
  provisioned?: boolean;
  slug?: string;
}

export const onboardingApi = {
  async config(): Promise<OnboardingConfig> {
    const res = await apiRequest<Envelope<OnboardingConfig>>("/onboarding/config");
    return res.data;
  },

  async availability(
    slug: string,
  ): Promise<{ available: boolean; reason?: string; slug?: string }> {
    const res = await apiRequest<
      Envelope<{ available: boolean; reason?: string; slug?: string }>
    >(`/onboarding/availability?slug=${encodeURIComponent(slug)}`);
    return res.data;
  },

  async start(input: OnboardingStartInput): Promise<OnboardingStartResult> {
    const res = await apiRequest<Envelope<OnboardingStartResult>>(
      "/onboarding/start",
      { method: "POST", body: input },
    );
    return res.data;
  },

  async status(
    reference: string,
  ): Promise<{ status: string; slug?: string }> {
    const res = await apiRequest<Envelope<{ status: string; slug?: string }>>(
      `/onboarding/status?reference=${encodeURIComponent(reference)}`,
    );
    return res.data;
  },
};
