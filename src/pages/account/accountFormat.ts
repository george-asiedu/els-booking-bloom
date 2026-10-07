import { format } from "date-fns";
import type { AppointmentDTO } from "@/lib/api";

export const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  pending_reschedule: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

// The raw enum reads badly to a customer ("pending_reschedule"), and this one
// needs to say who they're waiting on.
export const statusLabels: Record<string, string> = {
  pending: "pending",
  confirmed: "confirmed",
  pending_reschedule: "awaiting studio approval",
  completed: "completed",
  cancelled: "cancelled",
};

export const orderStatusColors: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  fulfilled: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export const orderStatusLabel: Record<string, string> = {
  pending_payment: "Payment pending",
  paid: "Paid",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

/**
 * Split bookings into upcoming and past. `appointment_date` is a calendar day
 * ("yyyy-MM-dd"), so it's compared with today's date as a string. Parsing it
 * with `new Date()` gives UTC midnight, which made every booking later today
 * count as past.
 */
export const splitByDay = (appointments: AppointmentDTO[], now = new Date()) => {
  const today = format(now, "yyyy-MM-dd");
  const isPast = (a: AppointmentDTO) =>
    a.appointment_date < today || a.status === "cancelled";
  return {
    upcoming: appointments.filter((a) => !isPast(a)),
    past: appointments.filter(isPast),
  };
};
