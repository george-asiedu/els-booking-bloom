import { apiRequest } from "@/lib/apiClient";

type Kind = "appointments" | "orders";
type Message = { message: string };

/**
 * Cancellations without moving money through the platform: customers ask,
 * admins approve (the usual Cancelled status) or decline, and admins record a
 * refund they made themselves.
 */
export const cancellationsApi = {
  request: (kind: Kind, id: string, reason?: string) =>
    apiRequest<Message>(`/cancellations/${kind}/${id}/request`, { method: "POST", auth: true, body: { reason } }),
  decline: (kind: Kind, id: string) =>
    apiRequest<Message>(`/cancellations/${kind}/${id}/decline`, { method: "POST", auth: true }),
  markRefunded: (kind: Kind, id: string, amount: number, note?: string) =>
    apiRequest<Message>(`/cancellations/${kind}/${id}/refunded`, { method: "POST", auth: true, body: { amount, note } }),
};
