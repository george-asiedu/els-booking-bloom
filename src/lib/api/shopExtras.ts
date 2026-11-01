import { apiRequest } from "../apiClient";
import { Envelope } from "./core";

// ---------------- Wishlist, coupons, product reviews ----------------

export const wishlistApi = {
  async list(): Promise<string[]> {
    return (await apiRequest<Envelope<string[]>>("/wishlist", { auth: true })).data;
  },
  async add(productId: string): Promise<string[]> {
    return (await apiRequest<Envelope<string[]>>(`/wishlist/${productId}`, { method: "POST", auth: true })).data;
  },
  async remove(productId: string): Promise<string[]> {
    return (await apiRequest<Envelope<string[]>>(`/wishlist/${productId}`, { method: "DELETE", auth: true })).data;
  },
};

export interface CouponDTO {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minSubtotal: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
}
export interface CouponInput {
  code: string;
  type: "PERCENT" | "FIXED";
  value: string;
  minSubtotal: string;
  maxUses: string;
  expiresAt: string;
}

export const couponsApi = {
  async list(): Promise<CouponDTO[]> {
    return (await apiRequest<Envelope<CouponDTO[]>>("/coupons", { auth: true })).data;
  },
  async create(input: CouponInput): Promise<void> {
    await apiRequest("/coupons", { method: "POST", auth: true, body: input });
  },
  async setActive(id: string, active: boolean): Promise<void> {
    await apiRequest(`/coupons/${id}`, { method: "PATCH", auth: true, body: { active } });
  },
  async remove(id: string): Promise<void> {
    await apiRequest(`/coupons/${id}`, { method: "DELETE", auth: true });
  },
};

export interface ProductReviewDTO {
  id: string;
  rating: number;
  content: string | null;
  createdAt: string;
  user: { profile: { fullName: string | null } | null };
}

export const productReviewsApi = {
  async list(productId: string): Promise<ProductReviewDTO[]> {
    return (await apiRequest<Envelope<ProductReviewDTO[]>>(`/products/${productId}/reviews`)).data;
  },
  async add(productId: string, rating: number, content: string): Promise<string> {
    const res = await apiRequest<{ message: string }>(`/products/${productId}/reviews`, {
      method: "POST",
      auth: true,
      body: { rating, content },
    });
    return res.message;
  },
};
