import { apiRequest } from "./apiClient";

interface Envelope<T> {
  message: string;
  data: T;
}

export type Plan = "STANDARD" | "PREMIUM" | "STOREFRONT";
export type Cadence = "MONTHLY" | "YEARLY";
export type BillingMode = "SUBSCRIPTION" | "REVENUE_SHARE";

export interface OnboardingConfig {
  revenueShareEnabled: boolean;
  commissionStandardPercent: number;
  commissionPremiumPercent: number;
  setupFeeStandard: number;
  setupFeePremium: number;
  // Subscription setup fee per plan (0 = none), paid at signup instead of the
  // first period and covering the first setupFeeMonths* months.
  subscriptionSetupFeeStandard: number;
  subscriptionSetupFeePremium: number;
  setupFeeMonthsMonthly: number;
  setupFeeMonthsYearly: number;
  // Welcome discount for new subscription signups: % off the plan price for
  // the first N months (0 = none). Set by the super admin.
  newStudioDiscountPercent: number;
  newStudioDiscountMonths: number;
  priceStandardMonthly: number;
  priceStandardYearly: number;
  pricePremiumMonthly: number;
  pricePremiumYearly: number;
  priceStorefrontMonthly: number;
  priceStorefrontYearly: number;
  subscriptionSetupFeeStorefront: number;
  commissionStorefrontPercent: number;
  setupFeeStorefront: number;
}

export interface OnboardingStartInput {
  name: string;
  slug: string;
  ownerEmail: string;
  // Proof from confirmEmailCode that the owner controls ownerEmail.
  emailToken: string;
  promoCode?: string;
  /** The inviting business, from ?ref= on an invite link. */
  ref?: string;
  ownerPassword: string;
  ownerFullName?: string;
  plan: Plan;
  cadence: Cadence;
  billingMode: BillingMode;
  // What the shop sells (lib/shopCategories). Required for Storefront.
  shopCategory?: string;
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

// What the "your studio is live" screen shows; sent once the studio exists.
export interface SignupSummary {
  reference: string;
  studioName: string;
  slug: string;
  websiteUrl: string;
  dashboardUrl: string;
  plan: Plan;
  cadence: Cadence;
  billingMode: BillingMode;
  amountPaid: number | null;
  currency: string;
  paidAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  coverageMonths: number | null;
  commissionPercent: number | null;
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

  async checkPromo(code: string, plan: Plan): Promise<{ code: string; percent: number }> {
    const res = await apiRequest<Envelope<{ code: string; percent: number }>>(
      `/onboarding/promo?code=${encodeURIComponent(code)}&plan=${plan}`,
    );
    return res.data;
  },

  async sendEmailCode(email: string): Promise<void> {
    await apiRequest("/onboarding/email-code", { method: "POST", body: { email } });
  },

  async confirmEmailCode(email: string, code: string): Promise<string> {
    const res = await apiRequest<Envelope<{ emailToken: string }>>(
      "/onboarding/email-code/confirm",
      { method: "POST", body: { email, code } },
    );
    return res.data.emailToken;
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
  ): Promise<{ status: string; slug?: string; summary?: SignupSummary | null }> {
    const res = await apiRequest<
      Envelope<{ status: string; slug?: string; summary?: SignupSummary | null }>
    >(
      `/onboarding/status?reference=${encodeURIComponent(reference)}`,
    );
    return res.data;
  },
};
