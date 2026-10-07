import { apiRequest } from "../apiClient";
import { Envelope } from "./core";

// ---------------------------------------------------------------------------
// Refunds (studio admin)
// ---------------------------------------------------------------------------

export type RefundStatus = "PENDING" | "PROCESSED" | "FAILED";

export interface RefundDTO {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: RefundStatus;
  reason: string | null;
  paymentId: string | null;
  orderId: string | null;
  appointmentId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  failureReason: string | null;
  processedAt: string | null;
  initiatedByEmail: string | null;
  createdAt: string;
}

export const refundsApi = {
  async list(params: { status?: RefundStatus; limit?: number } = {}): Promise<RefundDTO[]> {
    const p = new URLSearchParams();
    if (params.status) p.set("status", params.status);
    if (params.limit) p.set("limit", String(params.limit));
    const qs = p.toString();
    const res = await apiRequest<Envelope<RefundDTO[]>>(
      `/refunds${qs ? `?${qs}` : ""}`,
      { auth: true },
    );
    return res.data;
  },

  // `amount` omitted refunds everything still refundable — the server owns that
  // ceiling, so the UI never has to compute it.
  async refundPayment(
    paymentId: string,
    input: { amount?: number; reason?: string } = {},
  ): Promise<{ message: string; data: RefundDTO | null }> {
    return apiRequest<{ message: string; data: RefundDTO | null }>(
      `/refunds/payments/${paymentId}`,
      { method: "POST", auth: true, body: input },
    );
  },

  async refundOrder(
    orderId: string,
    input: { amount?: number; reason?: string } = {},
  ): Promise<{ message: string; data: RefundDTO | null }> {
    return apiRequest<{ message: string; data: RefundDTO | null }>(
      `/refunds/orders/${orderId}`,
      { method: "POST", auth: true, body: input },
    );
  },
};
