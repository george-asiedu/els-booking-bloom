import { apiRequest } from "../apiClient";
import { Envelope } from "./core";

// ---------------------------------------------------------------------------
// Transaction ledger (studio admin)
// ---------------------------------------------------------------------------

export type LedgerEntryType =
  | "BOOKING_PAYMENT"
  | "ORDER_PAYMENT"
  | "SUBSCRIPTION_PAYMENT"
  | "REFUND"
  | "ADJUSTMENT";
export type LedgerDirection = "CREDIT" | "DEBIT";
export type LedgerStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "ABANDONED"
  | "REVERSED";

export interface LedgerEntryDTO {
  id: string;
  studioId: string | null;
  type: LedgerEntryType;
  direction: LedgerDirection;
  status: LedgerStatus;
  amount: number;
  currency: string;
  reference: string | null;
  transactionId: string | null;
  channel: string | null;
  description: string;
  customerName: string | null;
  customerEmail: string | null;
  paymentAttemptId: string | null;
  paymentId: string | null;
  orderId: string | null;
  appointmentId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface PaymentAttemptDTO {
  id: string;
  reference: string;
  expectedAmount: number;
  paidAmount: number | null;
  currency: string;
  status: LedgerStatus;
  transactionId: string | null;
  channel: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface LedgerSummaryDTO {
  currency: string;
  received: number;
  refunded: number;
  paidOut: number;
  net: number;
  pending: number;
  failed: number;
  transactions: number;
  byType: {
    type: LedgerEntryType;
    direction: LedgerDirection;
    status: LedgerStatus;
    amount: number;
    count: number;
  }[];
}

export interface LedgerFilters {
  type?: LedgerEntryType | "";
  status?: LedgerStatus | "";
  direction?: LedgerDirection | "";
  source?: "customer" | "studio" | "";
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string | null;
}

// Only send parameters that carry a value — an empty string would be rejected
// by the API's enum validation rather than treated as "no filter".
export const ledgerQuery = (f: LedgerFilters = {}): string => {
  const p = new URLSearchParams();
  if (f.type) p.set("type", f.type);
  if (f.status) p.set("status", f.status);
  if (f.direction) p.set("direction", f.direction);
  if (f.source) p.set("source", f.source);
  if (f.search?.trim()) p.set("search", f.search.trim());
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.limit) p.set("limit", String(f.limit));
  if (f.cursor) p.set("cursor", f.cursor);
  return p.toString();
};

// A booking that occupies part of a day. `start` is normalised 24-hour;
// `label` is however it was stored (the picker writes 12-hour).
export interface BusySlot {
  start: string;
  label: string;
  minutes: number;
}

export const transactionsApi = {
  async list(
    filters: LedgerFilters = {},
  ): Promise<{ entries: LedgerEntryDTO[]; nextCursor: string | null }> {
    const qs = ledgerQuery(filters);
    const res = await apiRequest<{
      message: string;
      entries: LedgerEntryDTO[];
      nextCursor: string | null;
    }>(`/transactions${qs ? `?${qs}` : ""}`, { auth: true });
    return { entries: res.entries ?? [], nextCursor: res.nextCursor ?? null };
  },

  async summary(range: { from?: string; to?: string } = {}): Promise<LedgerSummaryDTO> {
    const p = new URLSearchParams();
    if (range.from) p.set("from", range.from);
    if (range.to) p.set("to", range.to);
    const qs = p.toString();
    const res = await apiRequest<Envelope<LedgerSummaryDTO>>(
      `/transactions/summary${qs ? `?${qs}` : ""}`,
      { auth: true },
    );
    return res.data;
  },

  async detail(
    id: string,
  ): Promise<{ entry: LedgerEntryDTO; attempts: PaymentAttemptDTO[] }> {
    const res = await apiRequest<
      Envelope<{ entry: LedgerEntryDTO; attempts: PaymentAttemptDTO[] }>
    >(`/transactions/${id}`, { auth: true });
    return res.data;
  },
};
