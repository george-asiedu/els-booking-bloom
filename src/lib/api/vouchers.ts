import { apiRequest } from "@/lib/apiClient";
import { CursorPage, Envelope, cursorPage, cursorQuery } from "./core";

export interface PackageOfferDTO {
  id: string;
  serviceId: string;
  name: string;
  sessions: number;
  price: number;
  active: boolean;
}

export interface VoucherDTO {
  id: string;
  kind: "GIFT_CARD" | "PACKAGE";
  code: string;
  status: "PENDING" | "ACTIVE" | "USED";
  price: number;
  balance: number;
  sessionsTotal: number;
  sessionsLeft: number;
  serviceId: string | null;
  buyerName: string;
  buyerEmail: string;
  recipientName: string | null;
  recipientEmail: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface VoucherCheck {
  code: string;
  kind: "GIFT_CARD" | "PACKAGE";
  balance: number;
  sessionsLeft: number;
  serviceId: string | null;
  serviceName: string | null;
}

export interface VoucherPurchase {
  authorizationUrl: string;
  reference: string;
  amount: number;
  processingFee: number;
}

/** One of a customer's own gift cards or packages. */
export interface MyVoucherDTO {
  id: string;
  kind: "GIFT_CARD" | "PACKAGE";
  status: "ACTIVE" | "USED";
  /** Null for a gift bought for someone else (only they get the code). */
  code: string | null;
  price: number;
  balance: number;
  sessionsLeft: number;
  sessionsTotal: number;
  serviceId: string | null;
  serviceName: string | null;
  sentTo: string | null;
  from: string | null;
  message: string | null;
  createdAt: string;
}

export const vouchersApi = {
  minePage: async (cursor?: string | null, limit = 20): Promise<CursorPage<MyVoucherDTO>> =>
    cursorPage(await apiRequest<Envelope<MyVoucherDTO[]>>(`/vouchers/mine?${cursorQuery(cursor, limit)}`, { auth: true })),
  packages: async () => (await apiRequest<{ data: PackageOfferDTO[] }>("/vouchers/packages")).data,
  buyGiftCard: async (body: {
    amount: number;
    buyerName: string;
    buyerEmail: string;
    recipientName?: string;
    recipientEmail?: string;
    message?: string;
  }) => (await apiRequest<{ data: VoucherPurchase }>("/vouchers/gift-card", { method: "POST", auth: true, body })).data,
  buyPackage: async (body: { packageId: string; buyerName: string; buyerEmail: string }) =>
    (await apiRequest<{ data: VoucherPurchase }>("/vouchers/package", { method: "POST", auth: true, body })).data,
  verify: async (reference: string) =>
    (await apiRequest<{ message: string; data: { kind: string; status: string; price: number; sessionsTotal: number; sentTo: string } }>(
      `/vouchers/verify?reference=${encodeURIComponent(reference)}`,
    )).data,
  check: async (code: string, serviceId?: string) =>
    (await apiRequest<{ data: VoucherCheck }>(
      `/vouchers/check?code=${encodeURIComponent(code)}${serviceId ? `&serviceId=${encodeURIComponent(serviceId)}` : ""}`,
    )).data,
  // Admin
  listPage: async (cursor?: string | null, limit = 25): Promise<CursorPage<VoucherDTO>> =>
    cursorPage(await apiRequest<Envelope<VoucherDTO[]>>(`/vouchers?${cursorQuery(cursor, limit)}`, { auth: true })),
  redeem: async (id: string, amount?: number) =>
    apiRequest<{ message: string }>(`/vouchers/${id}/redeem`, { method: "POST", auth: true, body: { amount } }),
  allPackages: async () => (await apiRequest<{ data: PackageOfferDTO[] }>("/vouchers/packages/all", { auth: true })).data,
  savePackage: async (id: string | null, body: Partial<PackageOfferDTO>) =>
    apiRequest<{ data: PackageOfferDTO }>(id ? `/vouchers/packages/${id}` : "/vouchers/packages", { method: id ? "PUT" : "POST", auth: true, body }),
  removePackage: async (id: string) => apiRequest<{ message: string }>(`/vouchers/packages/${id}`, { method: "DELETE", auth: true }),
};
