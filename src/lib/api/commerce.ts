import { apiRequest } from "../apiClient";
import { Envelope } from "./core";

// ---------------- Commerce: settings ----------------

export interface CommerceSettingsDTO {
  enabled: boolean;
  enable_pickup: boolean;
  enable_delivery: boolean;
  delivery_fee: number;
  /** Admins are told when stock falls to this or below. */
  low_stock_threshold: number;
  /** Delivery areas with their own fee. Empty means the flat fee applies. */
  delivery_zones: DeliveryZone[];
  /** Time windows customers choose from. Empty means no choice. */
  delivery_slots: string[];
}

export interface DeliveryZone { id: string; name: string; fee: number }

/** What delivery costs for the chosen area (or the flat fee without areas). */
export const deliveryFeeFor = (s: CommerceSettingsDTO | undefined, zoneId: string | undefined) =>
  !s ? 0 : s.delivery_zones.length ? s.delivery_zones.find((z) => z.id === zoneId)?.fee ?? 0 : s.delivery_fee;

interface RawCommerceSettings {
  enabled: boolean;
  enablePickup: boolean;
  enableDelivery: boolean;
  deliveryFee: number;
  lowStockThreshold?: number;
  deliveryZones?: DeliveryZone[];
  deliverySlots?: string[];
}

const normalizeCommerceSettings = (
  s: RawCommerceSettings,
): CommerceSettingsDTO => ({
  enabled: s.enabled,
  enable_pickup: s.enablePickup,
  enable_delivery: s.enableDelivery,
  delivery_fee: s.deliveryFee,
  low_stock_threshold: s.lowStockThreshold ?? 3,
  delivery_zones: Array.isArray(s.deliveryZones) ? s.deliveryZones : [],
  delivery_slots: Array.isArray(s.deliverySlots) ? s.deliverySlots : [],
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
    lowStockThreshold?: number;
    deliveryZones?: { id?: string; name: string; fee: number }[];
    deliverySlots?: string[];
  }): Promise<CommerceSettingsDTO> {
    const res = await apiRequest<Envelope<RawCommerceSettings>>(
      "/commerce/settings",
      { method: "PUT", auth: true, body: input },
    );
    return normalizeCommerceSettings(res.data);
  },
};
