// Display helpers for the transaction ledger. Kept out of the component file so
// both the studio and platform pages can import them without tripping React's
// fast-refresh rule (a module may export components OR constants, not both).
import { format } from "date-fns";
import type { LedgerEntryType, LedgerStatus } from "@/lib/api";

export const TYPE_LABEL: Record<LedgerEntryType, string> = {
  BOOKING_PAYMENT: "Booking",
  ORDER_PAYMENT: "Shop order",
  SUBSCRIPTION_PAYMENT: "Subscription",
  REFUND: "Refund",
  ADJUSTMENT: "Adjustment",
};

export const STATUS_LABEL: Record<LedgerStatus, string> = {
  SUCCESS: "Successful",
  PENDING: "Pending",
  FAILED: "Failed",
  ABANDONED: "Abandoned",
  REVERSED: "Reversed",
};

// Only SUCCESS reads as a positive outcome; everything else is muted or flagged
// so a studio admin never mistakes a failed charge for money received.
export const STATUS_VARIANT: Record<
  LedgerStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  SUCCESS: "default",
  PENDING: "secondary",
  FAILED: "destructive",
  ABANDONED: "outline",
  REVERSED: "destructive",
};

const CHANNEL_LABEL: Record<string, string> = {
  card: "Card",
  bank: "Bank transfer",
  bank_transfer: "Bank transfer",
  mobile_money: "Mobile money",
  ussd: "USSD",
  qr: "QR",
};

export const channelLabel = (c: string | null): string =>
  c ? (CHANNEL_LABEL[c] ?? c.replace(/_/g, " ")) : "—";

export const entryDate = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy, HH:mm");
};
