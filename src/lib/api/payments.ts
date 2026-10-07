import { apiRequest } from "../apiClient";
import { Envelope } from "./core";
import { PaymentStatus, PaymentType } from "./models";
import { OrderDTO, RawOrder, normalizeOrder } from "./orders";

// ---------------- Payments ----------------

export interface PaymentSettingsDTO {
  enabled: boolean;
  allow_full: boolean;
  allow_partial: boolean;
  deposit_percent: number;
}

interface RawPaymentSettings {
  enabled: boolean;
  allowFull: boolean;
  allowPartial: boolean;
  depositPercent: number;
}

const normalizePaymentSettings = (
  s: RawPaymentSettings,
): PaymentSettingsDTO => ({
  enabled: s.enabled,
  allow_full: s.allowFull,
  allow_partial: s.allowPartial,
  deposit_percent: s.depositPercent,
});

export interface InitializePaymentResult {
  authorization_url: string;
  access_code: string;
  reference: string;
  amount: number;
  email: string;
  subaccount: string | null;
  public_key: string;
  type: "FULL" | "PARTIAL";
}

interface RawInitialize {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  amount: number;
  email: string;
  subaccount: string | null;
  publicKey: string;
  type: "FULL" | "PARTIAL";
}

// Shared payment-target shape the in-app PaymentDialog consumes.
export interface PaymentTarget {
  reference: string;
  amount: number;
  email: string;
  access_code?: string;
  subaccount: string | null;
  public_key: string;
}

export type ChargeStatus = "success" | "pending" | "failed";

// Receipt shape returned by verify (payment + its appointment/service).
export interface PaymentReceiptDTO {
  status: PaymentStatus;
  type: PaymentType;
  amount: number;
  total_amount: number;
  balance: number;
  reference: string | null;
  channel: string | null;
  paid_at: string | null;
  full_name: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
  appointment_id: string | null;
}

interface RawVerify {
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  type: "FULL" | "PARTIAL";
  amount: number;
  totalAmount: number;
  reference: string | null;
  channel: string | null;
  paidAt: string | null;
  appointmentId?: string | null;
  appointment?: {
    fullName: string;
    appointmentDate: string;
    appointmentTime: string;
    service?: { name: string } | null;
  } | null;
}

export const paymentsApi = {
  async getSettings(): Promise<PaymentSettingsDTO> {
    const res = await apiRequest<Envelope<RawPaymentSettings>>(
      "/payments/settings",
    );
    return normalizePaymentSettings(res.data);
  },

  async updateSettings(input: {
    enabled?: boolean;
    allowFull?: boolean;
    allowPartial?: boolean;
    depositPercent?: number;
  }): Promise<PaymentSettingsDTO> {
    const res = await apiRequest<Envelope<RawPaymentSettings>>(
      "/payments/settings",
      { method: "PUT", auth: true, body: input },
    );
    return normalizePaymentSettings(res.data);
  },

  async initialize(
    appointmentId: string,
    type: "FULL" | "PARTIAL",
  ): Promise<InitializePaymentResult> {
    const res = await apiRequest<Envelope<RawInitialize>>(
      "/payments/initialize",
      { method: "POST", auth: true, body: { appointmentId, type } },
    );
    return {
      authorization_url: res.data.authorizationUrl,
      access_code: res.data.accessCode,
      reference: res.data.reference,
      amount: res.data.amount,
      email: res.data.email,
      subaccount: res.data.subaccount,
      public_key: res.data.publicKey,
      type: res.data.type,
    };
  },

  // Mobile-money charge (phone prompt) for a booking.
  async chargeMomo(input: {
    appointmentId: string;
    type: "FULL" | "PARTIAL";
    phone: string;
    provider: string;
  }): Promise<{ reference: string; status: string; displayText: string | null; amount: number }> {
    // status is Paystack's raw charge lifecycle: send_otp | pay_offline |
    // pending | success | failed — the dialog branches on it.
    const res = await apiRequest<
      Envelope<{ reference: string; status: string; displayText: string | null; amount: number }>
    >("/payments/charge/momo", { method: "POST", auth: true, body: input });
    return res.data;
  },

  async submitOtp(
    reference: string,
    otp: string,
  ): Promise<{ reference: string; status: string; displayText: string | null }> {
    const res = await apiRequest<
      Envelope<{ reference: string; status: string; displayText: string | null }>
    >("/payments/charge/submit-otp", {
      method: "POST",
      auth: true,
      body: { reference, otp },
    });
    return res.data;
  },

  async status(reference: string): Promise<ChargeStatus> {
    const res = await apiRequest<Envelope<{ reference: string; status: ChargeStatus }>>(
      `/payments/status?reference=${encodeURIComponent(reference)}`,
      { auth: true },
    );
    return res.data.status;
  },

  async verify(reference: string): Promise<PaymentReceiptDTO> {
    const res = await apiRequest<Envelope<RawVerify>>(
      `/payments/verify?reference=${encodeURIComponent(reference)}`,
      { auth: true },
    );
    return mapVerify(res.data);
  },

  // Combined booking + products charge — returns service payment and/or order.
  async verifyCombined(
    reference: string,
  ): Promise<{ payment: PaymentReceiptDTO | null; order: OrderDTO | null }> {
    const res = await apiRequest<
      Envelope<{ payment: RawVerify | null; order: RawOrder | null }>
    >(`/payments/verify-combined?reference=${encodeURIComponent(reference)}`, {
      auth: true,
    });
    return {
      payment: res.data.payment ? mapVerify(res.data.payment) : null,
      order: res.data.order ? normalizeOrder(res.data.order) : null,
    };
  },
};

const mapVerify = (p: RawVerify): PaymentReceiptDTO => ({
  status: p.status.toLowerCase() as PaymentStatus,
  type: p.type.toLowerCase() as PaymentType,
  amount: p.amount,
  total_amount: p.totalAmount,
  balance: Math.max(0, p.totalAmount - p.amount),
  reference: p.reference,
  channel: p.channel,
  paid_at: p.paidAt,
  full_name: p.appointment?.fullName ?? "",
  service_name: p.appointment?.service?.name ?? "your service",
  appointment_date: p.appointment?.appointmentDate?.slice(0, 10) ?? "",
  appointment_time: p.appointment?.appointmentTime ?? "",
  appointment_id: p.appointmentId ?? null,
});
