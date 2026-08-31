import { apiRequest } from "./apiClient";

interface Envelope<T> {
  message: string;
  data: T;
}

export type Plan = "STANDARD" | "PREMIUM";
export type Cadence = "MONTHLY" | "YEARLY";

export interface OnboardingStartInput {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerFullName?: string;
  plan: Plan;
  cadence: Cadence;
}

export interface OnboardingStartResult {
  reference: string;
  accessCode: string;
  authorizationUrl: string;
  email: string;
  publicKey: string;
}

export const onboardingApi = {
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
