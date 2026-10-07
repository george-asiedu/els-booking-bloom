import { apiRequest } from "../apiClient";
import { Envelope, uploadStudioMedia } from "./core";

// ---------------- Studio (storefront branding/content/features) ----------------

export interface StudioFeatureFlags {
  commerce: boolean;
  loyalty: boolean;
  referrals: boolean;
  reviews: boolean;
  gallery: boolean;
  onlinePayments: boolean;
  productsInBooking: boolean;
  loyaltyCapPercent?: number;
}

export interface StudioFeatureCard {
  title: string;
  description: string;
  icon?: string;
}

export interface StudioConfigDTO {
  name: string;
  slug: string;
  branding: {
    logoUrl: string | null;
    primaryColor: string | null;
    accentColor: string | null;
    fontFamily: string | null;
  };
  content: {
    heroHeadline: string | null;
    heroSubtext: string | null;
    aboutText: string | null;
    featureCards: StudioFeatureCard[] | null;
    showTestimonials: boolean;
  };
  settings: StudioFeatureFlags;
}

export const studioApi = {
  async getConfig(): Promise<StudioConfigDTO> {
    const res = await apiRequest<Envelope<StudioConfigDTO>>("/studio");
    return res.data;
  },
};

// ---- Admin: the studio's own branding + landing content ----

export interface StudioBrandingDTO {
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  fontFamily: string | null;
}

export interface StudioContentDTO {
  heroHeadline: string | null;
  heroSubtext: string | null;
  aboutText: string | null;
  featureCards: StudioFeatureCard[] | null;
  showTestimonials: boolean;
}

export interface BrandingUpdateInput {
  primaryColor?: string | null;
  accentColor?: string | null;
  fontFamily?: string | null;
  logo?: File | null;
  removeLogo?: boolean;
}

export const studioAdminApi = {
  async getBranding(): Promise<StudioBrandingDTO> {
    const res = await apiRequest<Envelope<StudioBrandingDTO>>("/studio/branding", {
      auth: true,
    });
    return res.data;
  },

  async updateBranding(input: BrandingUpdateInput): Promise<StudioBrandingDTO> {
    const logoUrl = input.logo ? await uploadStudioMedia(input.logo, "studio") : undefined;

    const res = await apiRequest<Envelope<StudioBrandingDTO>>("/studio/branding", {
      method: "PUT",
      auth: true,
      body: { primaryColor: input.primaryColor, accentColor: input.accentColor, fontFamily: input.fontFamily, removeLogo: input.removeLogo, logoUrl },
    });
    return res.data;
  },

  async getContent(): Promise<StudioContentDTO> {
    const res = await apiRequest<Envelope<StudioContentDTO>>("/studio/content", {
      auth: true,
    });
    return res.data;
  },

  async updateContent(
    input: Partial<StudioContentDTO>,
  ): Promise<StudioContentDTO> {
    const res = await apiRequest<Envelope<StudioContentDTO>>("/studio/content", {
      method: "PUT",
      auth: true,
      body: input,
    });
    return res.data;
  },

  async getDomain(): Promise<StudioDomainDTO> {
    const res = await apiRequest<Envelope<StudioDomainDTO>>("/studio/domain", {
      auth: true,
    });
    return res.data;
  },
  async setDomain(domain: string): Promise<StudioDomainDTO> {
    const res = await apiRequest<Envelope<StudioDomainDTO>>("/studio/domain", {
      method: "PUT",
      auth: true,
      body: { domain },
    });
    return res.data;
  },
  async verifyDomain(): Promise<StudioDomainDTO> {
    const res = await apiRequest<Envelope<StudioDomainDTO>>(
      "/studio/domain/verify",
      { method: "POST", auth: true },
    );
    return res.data;
  },

  async getPayout(): Promise<StudioPayoutDTO> {
    const res = await apiRequest<Envelope<StudioPayoutDTO>>("/studio/payout", {
      auth: true,
    });
    return res.data;
  },

  // Resolve a mobile-money number to its registered account name (Paystack).
  async getLoyalty(): Promise<{ loyaltyCapPercent: number }> {
    const res = await apiRequest<Envelope<{ loyaltyCapPercent: number }>>(
      "/studio/loyalty",
      { auth: true },
    );
    return res.data;
  },

  async updateLoyalty(
    loyaltyCapPercent: number,
  ): Promise<{ loyaltyCapPercent: number }> {
    const res = await apiRequest<Envelope<{ loyaltyCapPercent: number }>>(
      "/studio/loyalty",
      { method: "PUT", auth: true, body: { loyaltyCapPercent } },
    );
    return res.data;
  },

  async resolvePayoutName(
    accountNumber: string,
    provider: string,
  ): Promise<string> {
    const res = await apiRequest<Envelope<{ accountName: string }>>(
      `/studio/payout/resolve?accountNumber=${encodeURIComponent(
        accountNumber,
      )}&provider=${encodeURIComponent(provider)}`,
      { auth: true },
    );
    return res.data.accountName;
  },

  async updatePayout(input: {
    type: "momo" | "bank";
    provider: string;
    accountNumber: string;
    accountName: string;
  }): Promise<StudioPayoutDTO> {
    const res = await apiRequest<Envelope<StudioPayoutDTO>>("/studio/payout", {
      method: "PUT",
      auth: true,
      body: input,
    });
    return res.data;
  },
};


export interface StudioDomainDTO {
  domain: string | null;
  verified: boolean;
  txt: { name: string; value: string } | null;
}

export interface StudioPayoutDTO {
  connected: boolean;
  platformFeePercent: number;
  type: "momo" | "bank";
  provider: string | null;
  accountNumber: string | null;
  accountName: string | null;
  providers: { name: string; code: string }[];
  banks: { name: string; code: string }[];
}
