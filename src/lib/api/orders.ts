import { apiRequest } from "../apiClient";
import { CursorPage, Envelope, cursorPage, cursorQuery } from "./core";

// ---------------- Commerce: orders ----------------

export type OrderStatus = "pending_payment" | "paid" | "fulfilled" | "cancelled";
export type Fulfillment = "pickup" | "delivery";

export interface OrderItemDTO {
  name: string;
  unit_price: number;
  cost_price: number;
  quantity: number;
  line_total: number;
  profit: number;
}

export interface OrderDTO {
  id: string;
  order_number: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  delivery_address: string | null;
  delivery_phone: string | null;
  subtotal: number;
  discount_amount: number;
  points_redeemed: number;
  delivery_fee: number;
  total: number;
  // Running total of processed refunds against this order.
  refunded_amount?: number;
  profit: number; // Σ (unit-cost)×qty, excludes delivery — commerce revenue
  reference: string | null;
  paid_at: string | null;
  created_at: string;
  is_guest: boolean;
  appointment_id: string | null;
  items: OrderItemDTO[];
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
}

export interface RawOrder {
  id: string;
  orderNumber: string;
  status: "PENDING_PAYMENT" | "PAID" | "FULFILLED" | "CANCELLED";
  // Running total of processed refunds against this order.
  refundedAmount?: number;
  fulfillment: "PICKUP" | "DELIVERY";
  deliveryAddress: string | null;
  deliveryPhone: string | null;
  subtotal: number;
  discountAmount?: number;
  pointsRedeemed?: number;
  deliveryFee: number;
  total: number;
  reference: string | null;
  paidAt: string | null;
  createdAt: string;
  userId?: string | null;
  appointmentId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  items: { name: string; unitPrice: number; costPrice?: number; quantity: number }[];
  user?: { email: string; profile?: { fullName: string | null } | null } | null;
}

export const normalizeOrder = (o: RawOrder): OrderDTO => {
  const items = o.items.map((i) => {
    const cost = i.costPrice ?? 0;
    return {
      name: i.name,
      unit_price: i.unitPrice,
      cost_price: cost,
      quantity: i.quantity,
      line_total: Math.round(i.unitPrice * i.quantity * 100) / 100,
      profit: Math.round((i.unitPrice - cost) * i.quantity * 100) / 100,
    };
  });
  const profit =
    Math.round(items.reduce((s, i) => s + i.profit, 0) * 100) / 100;
  return {
    id: o.id,
    order_number: o.orderNumber,
    status: o.status.toLowerCase() as OrderStatus,
    fulfillment: o.fulfillment.toLowerCase() as Fulfillment,
    delivery_address: o.deliveryAddress,
    delivery_phone: o.deliveryPhone,
    subtotal: o.subtotal,
    discount_amount: o.discountAmount ?? 0,
    points_redeemed: o.pointsRedeemed ?? 0,
    delivery_fee: o.deliveryFee,
    total: o.total,
    refunded_amount: o.refundedAmount ?? 0,
    profit,
    reference: o.reference,
    paid_at: o.paidAt,
    created_at: o.createdAt,
    is_guest: !o.userId,
    appointment_id: o.appointmentId ?? null,
    items,
    customer_name: o.customerName ?? o.user?.profile?.fullName ?? null,
    customer_email: o.customerEmail ?? o.user?.email ?? null,
    customer_phone: o.customerPhone ?? null,
  };
};

export interface CheckoutInput {
  fulfillment: "PICKUP" | "DELIVERY";
  deliveryAddress?: string;
  deliveryPhone?: string;
  applyPoints?: boolean;
  referralCode?: string;
}

export interface GuestCheckoutInput {
  items: { productId: string; quantity: number }[];
  name: string;
  email: string;
  phone: string;
  fulfillment: "PICKUP" | "DELIVERY";
  deliveryAddress?: string;
  deliveryPhone?: string;
  referralCode?: string;
}

export interface CheckoutResult {
  authorization_url: string;
  access_code: string;
  reference: string;
  order_id: string;
  order_number: string;
  total: number;
  email: string;
  subaccount: string | null;
  public_key: string;
}

interface RawCheckout {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  orderId: string;
  orderNumber?: string;
  total: number;
  email: string;
  subaccount: string | null;
  publicKey: string;
}

const mapCheckout = (d: RawCheckout): CheckoutResult => ({
  authorization_url: d.authorizationUrl,
  access_code: d.accessCode,
  reference: d.reference,
  order_id: d.orderId,
  order_number: d.orderNumber ?? "",
  total: d.total,
  email: d.email,
  subaccount: d.subaccount,
  public_key: d.publicKey,
});

export const ordersApi = {
  async checkout(input: CheckoutInput): Promise<CheckoutResult> {
    const res = await apiRequest<Envelope<RawCheckout>>("/orders/checkout", {
      method: "POST",
      auth: true,
      body: input,
    });
    return mapCheckout(res.data);
  },

  async guestCheckout(input: GuestCheckoutInput): Promise<CheckoutResult> {
    const res = await apiRequest<Envelope<RawCheckout>>(
      "/orders/guest-checkout",
      { method: "POST", body: input },
    );
    return mapCheckout(res.data);
  },

  // Retry payment for an existing unpaid order (fresh Paystack access code).
  async repay(
    orderId: string,
  ): Promise<{ accessCode: string; reference: string; publicKey: string }> {
    const res = await apiRequest<
      Envelope<{ accessCode: string; reference: string; publicKey: string }>
    >(`/orders/${orderId}/repay`, { method: "POST", auth: true });
    return res.data;
  },

  async bookingCheckout(input: {
    appointmentId: string;
    items: { productId: string; quantity: number }[];
    serviceType?: "FULL" | "PARTIAL";
    referralCode?: string;
  }): Promise<CheckoutResult & { service_due_now: number; product_subtotal: number }> {
    const res = await apiRequest<
      Envelope<RawCheckout & { serviceDueNow: number; productSubtotal: number }>
    >("/orders/booking-checkout", { method: "POST", auth: true, body: input });
    return {
      ...mapCheckout(res.data),
      service_due_now: res.data.serviceDueNow,
      product_subtotal: res.data.productSubtotal,
    };
  },
  async listMine(): Promise<OrderDTO[]> {
    const res = await apiRequest<Envelope<RawOrder[]>>(`/orders/me?${cursorQuery(undefined, 100)}`, {
      auth: true,
    });
    return res.data.map(normalizeOrder);
  },
  async listMinePage(cursor?: string | null, limit = 25): Promise<CursorPage<OrderDTO>> {
    const res = await apiRequest<Envelope<RawOrder[]>>(`/orders/me?${cursorQuery(cursor, limit)}`, { auth: true });
    return { ...cursorPage(res), items: res.data.map(normalizeOrder) };
  },
  async listAll(): Promise<OrderDTO[]> {
    const res = await apiRequest<Envelope<RawOrder[]>>(`/orders?${cursorQuery(undefined, 100)}`, {
      auth: true,
    });
    return res.data.map(normalizeOrder);
  },
  async listAllPage(cursor?: string | null, limit = 25): Promise<CursorPage<OrderDTO>> {
    const res = await apiRequest<Envelope<RawOrder[]>>(`/orders?${cursorQuery(cursor, limit)}`, { auth: true });
    return { ...cursorPage(res), items: res.data.map(normalizeOrder) };
  },
  async verify(reference: string): Promise<OrderDTO> {
    const res = await apiRequest<Envelope<RawOrder>>(
      `/orders/verify?reference=${encodeURIComponent(reference)}`,
      { auth: true },
    );
    return normalizeOrder(res.data);
  },
  async updateStatus(id: string, status: OrderStatus): Promise<OrderDTO> {
    const res = await apiRequest<Envelope<RawOrder>>(`/orders/${id}/status`, {
      method: "PATCH",
      auth: true,
      body: { status: status.toUpperCase() },
    });
    return normalizeOrder(res.data);
  },
};
