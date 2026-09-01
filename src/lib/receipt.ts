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
}

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

// Generate and download a branded PDF receipt for a paid booking transaction.
export const downloadReceipt = (data: ReceiptData, brand: string = DEFAULT_BRAND) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 48;
  const right = pageWidth - 48;
  let y = 64;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...PINK);
  doc.text(brand, left, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...GREY);
  doc.text("Payment Receipt", left, y + 20);

  // Reference + issue date (right aligned)
  doc.setFontSize(10);
  doc.text(`Reference: ${data.reference ?? "—"}`, right, y, { align: "right" });
  doc.text(`Issued: ${format(data.issuedAt, "MMM d, yyyy")}`, right, y + 15, {
    align: "right",
  });

  y += 44;
  doc.setDrawColor(...PINK);
  doc.setLineWidth(1.5);
  doc.line(left, y, right, y);

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

  const money = (n: number) => `GHS ${n.toLocaleString()}`;
  const amountLabel = data.type === "partial" ? "Deposit paid" : "Amount paid";

  doc.setTextColor(...GREY);
  doc.text("Total", left, y);
  doc.setTextColor(...DARK);
  doc.text(money(data.totalAmount), right, y, { align: "right" });
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PINK);
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
  doc.setTextColor(22, 163, 74);
  doc.text(`STATUS: ${data.status.toUpperCase()}`, left, y);

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(
    `Thank you for choosing ${brand}.`,
    left,
    doc.internal.pageSize.getHeight() - 56,
  );

  doc.save(`receipt-${data.reference ?? "receipt"}.pdf`);
};

// Generate and download a branded PDF receipt for a product order.
export const downloadOrderReceipt = (order: OrderDTO, brand: string = DEFAULT_BRAND) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 48;
  const right = pageWidth - 48;
  let y = 64;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...PINK);
  doc.text(brand, left, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...GREY);
  doc.text("Order Receipt", left, y + 20);

  const issued = order.paid_at ? new Date(order.paid_at) : new Date(order.created_at);
  doc.setFontSize(10);
  doc.text(`Order: ${order.order_number}`, right, y, { align: "right" });
  doc.text(`Issued: ${format(issued, "MMM d, yyyy")}`, right, y + 15, {
    align: "right",
  });

  y += 44;
  doc.setDrawColor(...PINK);
  doc.setLineWidth(1.5);
  doc.line(left, y, right, y);

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
    doc.text(`${it.name}  x${it.quantity}`, left, y);
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
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PINK);
  doc.text("Total", left, y);
  doc.text(money(order.total), right, y, { align: "right" });

  y += 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(22, 163, 74);
  doc.text(`STATUS: ${order.status.toUpperCase()}`, left, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(`Reference: ${order.reference ?? "—"}`, left, y + 18);
  doc.text(
    `Thank you for shopping with ${brand}.`,
    left,
    doc.internal.pageSize.getHeight() - 56,
  );

  doc.save(`order-${order.order_number}.pdf`);
};
