// ---------------- Types (component-facing) ----------------

// Category is now a dynamic, admin-managed slug (e.g. "nails", "makeup-glam").
export type ServiceCategory = string;

export interface ServiceDTO {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  duration: string;
  price: number;
  promo_price: number | null;
  on_promo: boolean;
  effective_price: number; // promo_price when on promo, else price
  popular: boolean;
  active: boolean;
  image_url: string | null;
}

export interface AppointmentServiceDTO {
  id: string;
  name: string;
  duration: string;
  price: number;
  category: ServiceCategory;
}

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";
export type PaymentType = "full" | "partial";

export interface PaymentInfoDTO {
  // Present on admin reads; absent on the public verify shape, which has no
  // reason to expose an internal payment id.
  id?: string;
  status: PaymentStatus;
  type: PaymentType;
  amount: number; // amount charged/paid in this transaction
  // Running total already refunded, so the UI can show what is left to give back.
  refunded_amount?: number;
  total_amount: number; // full amount due for the booking
  balance: number; // total_amount - amount (0 for full payments)
  reference: string | null;
  channel: string | null;
  paid_at: string | null;
}

export interface AppointmentDTO {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  service_id: string;
  appointment_date: string; // yyyy-MM-dd
  appointment_time: string;
  notes: string | null;
  design_image_url: string | null;
  // pending_reschedule: the customer moved the booking and the studio hasn't
  // approved the new slot yet (the server's PENDING_RESCHEDULE).
  status: "pending" | "confirmed" | "pending_reschedule" | "completed" | "cancelled";
  user_id: string | null;
  created_at: string;
  total_price: number;
  discount_amount: number;
  points_redeemed: number;
  amount_due: number;
  payment: PaymentInfoDTO | null;
  services: AppointmentServiceDTO | null;
}

// ---------------- Raw server shapes ----------------

export interface RawService {
  id: string;
  name: string;
  category: string;
  description: string | null;
  duration: string;
  price: number;
  promoPrice: number | null;
  popular: boolean;
  active: boolean;
  imageUrl: string | null;
}

export interface RawAppointment {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
  notes: string | null;
  designImageUrl: string | null;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  userId: string | null;
  createdAt: string;
  totalPrice: number | null;
  discountAmount: number;
  pointsRedeemed: number;
  payment?: {
    id: string;
    status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
    type: "FULL" | "PARTIAL";
    amount: number;
    // Running total of processed refunds against this payment.
    refundedAmount?: number;
    totalAmount: number;
    reference: string | null;
    channel: string | null;
    paidAt: string | null;
  } | null;
  service?: {
    id: string;
    name: string;
    duration: string;
    price: number;
    category: string;
  } | null;
}

// ---------------- Normalizers ----------------

const toDateOnly = (iso: string): string => {
  // Server stores appointmentDate at UTC midnight; take the calendar date.
  return iso.slice(0, 10);
};

export const normalizeService = (s: RawService): ServiceDTO => {
  const onPromo = s.promoPrice != null && s.promoPrice < s.price;
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description ?? "",
    duration: s.duration,
    price: s.price,
    promo_price: s.promoPrice,
    on_promo: onPromo,
    effective_price: onPromo ? (s.promoPrice as number) : s.price,
    popular: s.popular,
    active: s.active,
    image_url: s.imageUrl,
  };
};

export const normalizeAppointment = (a: RawAppointment): AppointmentDTO => ({
  id: a.id,
  full_name: a.fullName,
  phone: a.phone,
  email: a.email,
  service_id: a.serviceId,
  appointment_date: toDateOnly(a.appointmentDate),
  appointment_time: a.appointmentTime,
  notes: a.notes,
  design_image_url: a.designImageUrl,
  status: a.status.toLowerCase() as AppointmentDTO["status"],
  user_id: a.userId,
  created_at: a.createdAt,
  total_price: a.totalPrice ?? 0,
  discount_amount: a.discountAmount ?? 0,
  points_redeemed: a.pointsRedeemed ?? 0,
  amount_due: (a.totalPrice ?? 0) - (a.discountAmount ?? 0),
  payment: a.payment
    ? {
        id: a.payment.id,
        status: a.payment.status.toLowerCase() as PaymentStatus,
        type: a.payment.type.toLowerCase() as PaymentType,
        amount: a.payment.amount,
        refunded_amount: a.payment.refundedAmount ?? 0,
        total_amount: a.payment.totalAmount,
        balance: Math.max(0, a.payment.totalAmount - a.payment.amount),
        reference: a.payment.reference,
        channel: a.payment.channel,
        paid_at: a.payment.paidAt,
      }
    : null,
  services: a.service
    ? {
        id: a.service.id,
        name: a.service.name,
        duration: a.service.duration,
        price: a.service.price,
        category: a.service.category,
      }
    : null,
});
