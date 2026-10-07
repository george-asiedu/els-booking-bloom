import { apiRequest } from "../apiClient";
import { Envelope } from "./core";

// ---------------- Loyalty & Referral ----------------

export interface LoyaltyPointsDTO {
  points: number;
  lifetime_points: number;
}

export interface LoyaltyTransactionDTO {
  id: string;
  points: number;
  type: string;
  description: string | null;
  created_at: string;
}

export interface ReferralCodeDTO {
  code: string;
  uses: number;
}

export const accountApi = {
  async getLoyalty(): Promise<LoyaltyPointsDTO> {
    const res = await apiRequest<
      Envelope<{ points: number; lifetimePoints: number }>
    >("/account/loyalty", { auth: true });
    return {
      points: res.data.points,
      lifetime_points: res.data.lifetimePoints,
    };
  },

  async getTransactions(): Promise<LoyaltyTransactionDTO[]> {
    const res = await apiRequest<
      Envelope<
        {
          id: string;
          points: number;
          type: string;
          description: string | null;
          createdAt: string;
        }[]
      >
    >("/account/loyalty/transactions", { auth: true });
    return res.data.map((t) => ({
      id: t.id,
      points: t.points,
      type: t.type,
      description: t.description,
      created_at: t.createdAt,
    }));
  },

  async getReferral(): Promise<ReferralCodeDTO> {
    const res = await apiRequest<Envelope<{ code: string; uses: number }>>(
      "/account/referral",
      { auth: true },
    );
    return { code: res.data.code, uses: res.data.uses };
  },

  async redeem(
    points: number,
  ): Promise<{ points: number; redeemed: number; ghsValue: number }> {
    const res = await apiRequest<
      Envelope<{ points: number; redeemed: number; ghsValue: number }>
    >("/account/loyalty/redeem", {
      method: "POST",
      auth: true,
      body: { points },
    });
    return res.data;
  },
};
