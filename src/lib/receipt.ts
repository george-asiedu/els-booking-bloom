import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { AppointmentDTO, PaymentReceiptDTO, OrderDTO } from "./api";

// Neutral platform fallback; callers pass the current studio's name.
const DEFAULT_BRAND = "Zuri Studios";
const PINK: [number, number, number] = [190, 24, 93];
const GREY: [number, number, number] = [107, 114, 128];
const DARK: [number, number, number] = [31, 41, 55];

// Normalized shape the PDF is drawn from — fed by either an appointment (from
// the dashboard) or a verify result (from the payment success screen).
export interface ReceiptData {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  serviceName: string;
  appointmentDate: string; // yyyy-MM-dd
  appointmentTime: string;
  type: "full" | "partial";
  channel?: string | null;
  totalAmount: number;
  amount: number;
  balance: number;
  reference: string | null;
  status: string;
  issuedAt: Date;
  bookingStatus?: AppointmentDTO["status"];
}

export interface DocumentBrand {
  name: string;
  primaryColor?: string | null;
  accentColor?: string | null;
}

type BrandInput = string | DocumentBrand;

const brandDetails = (brand: BrandInput): DocumentBrand =>
  typeof brand === "string" ? { name: brand } : brand;

const pdfColor = (hex: string | null | undefined, fallback: [number, number, number]): [number, number, number] => {
  const match = hex?.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  return match ? [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)] : fallback;
};

const money = (n: number) => `GHS ${n.toLocaleString()}`;

const drawHeader = (doc: jsPDF, brand: DocumentBrand, title: string, reference: string | null, issuedAt: Date) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 48;
  const right = pageWidth - 48;
  const color = pdfColor(brand.primaryColor, PINK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...color);
  doc.text(brand.name || DEFAULT_BRAND, left, 62);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(title.toUpperCase(), left, 82);
  doc.setFontSize(9);
  doc.text(`Reference: ${reference || "Not available"}`, right, 62, { align: "right" });
  doc.text(`Issued: ${format(issuedAt, "MMM d, yyyy")}`, right, 77, { align: "right" });
  doc.setDrawColor(...color);
  doc.setLineWidth(1.25);
  doc.line(left, 98, right, 98);
  return { left, right, y: 128, color };
};

const drawStatus = (doc: jsPDF, text: string, y: number, tone: "success" | "warning" | "error" | "neutral" = "neutral") => {
  const colors = { success: [22, 125, 75] as [number, number, number], warning: [180, 110, 20] as [number, number, number], error: [180, 45, 55] as [number, number, number], neutral: DARK };
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...colors[tone]);
  doc.text(`STATUS  ·  ${text.replace(/_/g, " ").toUpperCase()}`, 48, y);
};

export const receiptFromAppointment = (
  apt: AppointmentDTO,
): ReceiptData | null => {
  const p = apt.payment;
  if (!p) return null;
  return {
    fullName: apt.full_name,
    email: apt.email,
    phone: apt.phone,
    serviceName: apt.services?.name ?? "Service",
    appointmentDate: apt.appointment_date,
    appointmentTime: apt.appointment_time,
    type: p.type,
    channel: p.channel,
    totalAmount: p.total_amount,
    amount: p.amount,
    balance: p.balance,
    reference: p.reference,
    status: p.status,
    issuedAt: new Date(p.paid_at || apt.created_at),
    bookingStatus: apt.status,
  };
};

export const receiptFromVerify = (r: PaymentReceiptDTO): ReceiptData => ({
  fullName: r.full_name,
  serviceName: r.service_name,
  appointmentDate: r.appointment_date,
  appointmentTime: r.appointment_time,
  type: r.type,
  channel: r.channel,
  totalAmount: r.total_amount,
  amount: r.amount,
  balance: r.balance,
  reference: r.reference,
  status: r.status,
  issuedAt: r.paid_at ? new Date(r.paid_at) : new Date(),
});

/** Download an appointment document even when the booking has no payment. */
export const downloadBookingDocument = (apt: AppointmentDTO, brand: BrandInput = DEFAULT_BRAND) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const branding = brandDetails(brand);
  const issuedAt = new Date(apt.created_at);
  const { left, right, y: startY, color } = drawHeader(doc, branding,
    apt.status === "confirmed" ? "Appointment confirmed" : apt.status === "cancelled" ? "Appointment cancelled" : apt.status === "completed" ? "Appointment completed" : "Booking request",
    null, issuedAt);
  let y = startY;
  const line = (label: string, value: string, strong = false) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...GREY);
    doc.text(label, left, y);
    doc.setFont("helvetica", strong ? "bold" : "normal");
    doc.setTextColor(...DARK);
    doc.text(value, right, y, { align: "right", maxWidth: right - left - 120 });
    y += 25;
  };
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  doc.text(apt.services?.name ?? "Appointment", left, y);
  y += 34;
  line("Customer", apt.full_name);
  line("Appointment", `${format(new Date(apt.appointment_date), "MMM d, yyyy")} · ${apt.appointment_time}`);
  if (apt.services?.duration) line("Duration", apt.services.duration);
  line("Booking status", apt.status.replace(/_/g, " ").toUpperCase(), true);
  line("Requested amount", money(apt.amount_due));
  if (apt.payment) {
    const p = apt.payment;
    const paymentState = p.status === "paid" ? p.balance > 0 ? "PARTIALLY PAID" : "PAID IN FULL" : p.status.toUpperCase();
    line("Payment status", paymentState, true);
    if ((p.status === "paid" || p.status === "refunded") && p.amount > 0) line("Amount paid", money(p.amount));
    if (p.balance > 0) line("Remaining balance", money(p.balance));
    if (p.channel) line("Payment method", p.channel.replace(/_/g, " "));
    if (p.reference) line("Payment reference", p.reference);
  } else {
    line("Payment status", "UNPAID", true);
  }
  y += 8;
  doc.setDrawColor(229, 231, 235);
  doc.line(left, y, right, y);
  y += 24;
  drawStatus(doc, apt.status, y, apt.status === "confirmed" || apt.status === "completed" ? "success" : apt.status === "cancelled" ? "error" : "warning");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text(`Thank you for choosing ${branding.name}.`, left, doc.internal.pageSize.getHeight() - 52);
  doc.setTextColor(...color);
  doc.save("booking-document.pdf");
};

// Generate and download a branded PDF receipt for a paid booking transaction.
export const downloadReceipt = (data: ReceiptData, brand: BrandInput = DEFAULT_BRAND) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const branding = brandDetails(brand);
  const { left, right, y: startY, color } = drawHeader(doc, branding, "Payment receipt", data.reference, data.issuedAt);
  let y = startY;

  // Billed to
  y += 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text("Billed to", left, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GREY);
  doc.text(data.fullName || "Customer", left, y + 16);
  let billY = y + 31;
  if (data.email) {
    doc.text(data.email, left, billY);
    billY += 15;
  }
  if (data.phone) doc.text(data.phone, left, billY);

  // Line-item rows
  const rows: [string, string][] = [
    ["Service", data.serviceName],
    [
      "Appointment",
      `${format(new Date(data.appointmentDate), "MMM d, yyyy")} · ${data.appointmentTime}`,
    ],
    ["Payment type", data.type === "partial" ? "Deposit" : "Full payment"],
    ["Method", data.channel ? data.channel.replace(/_/g, " ") : "Paystack"],
  ];

  y += 78;
  doc.setFontSize(11);
  rows.forEach(([label, value]) => {
    doc.setTextColor(...GREY);
    doc.text(label, left, y);
    doc.setTextColor(...DARK);
    doc.text(String(value), right, y, { align: "right" });
    y += 24;
  });

  // Totals block
  y += 8;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(1);
  doc.line(left, y, right, y);
  y += 26;

  const amountLabel = "Amount paid";

  doc.setTextColor(...GREY);
  doc.text("Total", left, y);
  doc.setTextColor(...DARK);
  doc.text(money(data.totalAmount), right, y, { align: "right" });
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...color);
  doc.text(amountLabel, left, y);
  doc.text(money(data.amount), right, y, { align: "right" });
  y += 24;

  if (data.balance > 0) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GREY);
    doc.text("Balance due at studio", left, y);
    doc.setTextColor(217, 119, 6);
    doc.text(money(data.balance), right, y, { align: "right" });
    y += 24;
  }

  // Status
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const statusTone = data.status === "paid" ? "success" : data.status === "refunded" ? "warning" : data.status === "failed" ? "error" : "neutral";
  drawStatus(doc, data.type === "partial" && data.balance > 0 ? "Partially paid" : data.status, y, statusTone);
  if (data.bookingStatus) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GREY);
    doc.text(`Booking status: ${data.bookingStatus.replace(/_/g, " ")}`, left, y + 18);
  }

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(
    `Thank you for choosing ${branding.name}.`,
    left,
    doc.internal.pageSize.getHeight() - 56,
  );

  doc.save(`receipt-${data.reference ?? "receipt"}.pdf`);
};

// Generate and download a branded PDF receipt for a product order.
export const downloadOrderReceipt = (order: OrderDTO, brand: BrandInput = DEFAULT_BRAND) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const branding = brandDetails(brand);
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 48;
  const right = pageWidth - 48;
  let y = 64;

  const issued = order.paid_at ? new Date(order.paid_at) : new Date(order.created_at);
  const { color } = drawHeader(doc, branding, "Order receipt", order.reference ?? order.order_number, issued);
  y = 128;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(`Order ${order.order_number}`, left, y);
  if (order.customer_name) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...GREY);
    doc.text(`Customer: ${order.customer_name}`, right, y, { align: "right" });
  }

  // Fulfillment
  y += 26;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text("Fulfillment", left, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GREY);
  doc.text(
    order.fulfillment === "delivery" ? "Delivery" : "Pickup at studio",
    right,
    y,
    { align: "right" },
  );
  if (order.fulfillment === "delivery" && order.delivery_address) {
    y += 16;
    doc.text(order.delivery_address, right, y, { align: "right" });
  }

  // Items
  y += 30;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(1);
  doc.line(left, y, right, y);
  y += 22;

  const money = (n: number) => `GHS ${n.toLocaleString()}`;
  doc.setFontSize(11);
  order.items.forEach((it) => {
    doc.setTextColor(...DARK);
    doc.text(`${it.name}  ·  ${it.quantity} × ${money(it.unit_price)}`, left, y, { maxWidth: right - left - 100 });
    doc.text(money(it.line_total), right, y, { align: "right" });
    y += 22;
  });

  // Totals
  y += 6;
  doc.setDrawColor(229, 231, 235);
  doc.line(left, y, right, y);
  y += 24;
  doc.setTextColor(...GREY);
  doc.text("Subtotal", left, y);
  doc.setTextColor(...DARK);
  doc.text(money(order.subtotal), right, y, { align: "right" });
  y += 22;
  if (order.delivery_fee > 0) {
    doc.setTextColor(...GREY);
    doc.text("Delivery", left, y);
    doc.setTextColor(...DARK);
    doc.text(money(order.delivery_fee), right, y, { align: "right" });
    y += 22;
  }
  if (order.discount_amount > 0) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GREY);
    doc.text("Discount", left, y);
    doc.setTextColor(...DARK);
    doc.text(`-${money(order.discount_amount)}`, right, y, { align: "right" });
    y += 22;
  }
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...color);
  doc.text("Total", left, y);
  doc.text(money(order.total), right, y, { align: "right" });
  y += 22;
  if (order.status === "paid" || order.status === "fulfilled") {
    doc.setTextColor(...GREY);
    doc.text("Amount paid", left, y);
    doc.setTextColor(...DARK);
    doc.text(money(order.total), right, y, { align: "right" });
  }

  y += 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  drawStatus(doc, order.status, y, order.status === "paid" || order.status === "fulfilled" ? "success" : order.status === "cancelled" ? "error" : "warning");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(`Reference: ${order.reference ?? "—"}`, left, y + 18);
  doc.text(
    `Thank you for shopping with ${branding.name}.`,
    left,
    doc.internal.pageSize.getHeight() - 56,
  );

  doc.save(`order-${order.order_number}.pdf`);
};
