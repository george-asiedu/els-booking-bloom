import { apiRequest } from "../apiClient";
import { Envelope } from "./core";

// ---------------- Promo banners ----------------

export type PromoPlacement = "SHOP" | "BOOKING" | "BOTH";

export interface PromoBannerDTO {
  id: string;
  message: string;
  linkUrl: string | null;
  bgColor: string | null;
  textColor: string | null;
  placement: PromoPlacement;
  active: boolean;
  order: number;
}

export interface PromoBannerInput {
  message: string;
  linkUrl?: string | null;
  bgColor?: string | null;
  textColor?: string | null;
  placement?: PromoPlacement;
  active?: boolean;
  order?: number;
}

export const promoApi = {
  // Public: active banners for a placement ("shop" | "booking").
  async listActive(placement?: "shop" | "booking"): Promise<PromoBannerDTO[]> {
    const qs = placement ? `?placement=${placement}` : "";
    const res = await apiRequest<Envelope<PromoBannerDTO[]>>(
      `/promo-banners${qs}`,
    );
    return res.data;
  },
  async listAll(): Promise<PromoBannerDTO[]> {
    const res = await apiRequest<Envelope<PromoBannerDTO[]>>(
      "/promo-banners/all",
      { auth: true },
    );
    return res.data;
  },
  async create(input: PromoBannerInput): Promise<PromoBannerDTO> {
    const res = await apiRequest<Envelope<PromoBannerDTO>>("/promo-banners", {
      method: "POST",
      auth: true,
      body: input,
    });
    return res.data;
  },
  async update(
    id: string,
    input: Partial<PromoBannerInput>,
  ): Promise<PromoBannerDTO> {
    const res = await apiRequest<Envelope<PromoBannerDTO>>(
      `/promo-banners/${id}`,
      { method: "PUT", auth: true, body: input },
    );
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await apiRequest<Envelope<null>>(`/promo-banners/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
};
