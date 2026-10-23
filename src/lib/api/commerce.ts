import { apiRequest } from "../apiClient";
import { Envelope } from "./core";

// ---------------- Commerce: settings ----------------

export interface CommerceSettingsDTO {
  enabled: boolean;
  enable_pickup: boolean;
  enable_delivery: boolean;
  delivery_fee: number;
}

interface RawCommerceSettings {
  enabled: boolean;
  enablePickup: boolean;
  enableDelivery: boolean;
  deliveryFee: number;
}

const normalizeCommerceSettings = (
  s: RawCommerceSettings,
): CommerceSettingsDTO => ({
  enabled: s.enabled,
  enable_pickup: s.enablePickup,
  enable_delivery: s.enableDelivery,
  delivery_fee: s.deliveryFee,
});

export const commerceApi = {
  async getSettings(): Promise<CommerceSettingsDTO> {
    const res = await apiRequest<Envelope<RawCommerceSettings>>(
      "/commerce/settings",
    );
    return normalizeCommerceSettings(res.data);
  },
  async updateSettings(input: {
    enabled?: boolean;
    enablePickup?: boolean;
    enableDelivery?: boolean;
    deliveryFee?: number;
  }): Promise<CommerceSettingsDTO> {
    const res = await apiRequest<Envelope<RawCommerceSettings>>(
      "/commerce/settings",
      { method: "PUT", auth: true, body: input },
    );
    return normalizeCommerceSettings(res.data);
  },
};
