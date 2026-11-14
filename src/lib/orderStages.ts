import type { OrderStatus } from "@/lib/api/orders";

// One set of names and colours for order stages, used by the customer's
// orders, the shop's orders page and the dashboard.
export const ORDER_STAGE: Record<OrderStatus, { label: string; className: string }> = {
  pending_payment: { label: "Awaiting payment", className: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300" },
  paid: { label: "Paid", className: "bg-blue-100 text-blue-900 dark:bg-blue-500/15 dark:text-blue-300" },
  preparing: { label: "Preparing", className: "bg-violet-100 text-violet-900 dark:bg-violet-500/15 dark:text-violet-300" },
  ready_for_pickup: { label: "Ready for pickup", className: "bg-teal-100 text-teal-900 dark:bg-teal-500/15 dark:text-teal-300" },
  out_for_delivery: { label: "Out for delivery", className: "bg-teal-100 text-teal-900 dark:bg-teal-500/15 dark:text-teal-300" },
  fulfilled: { label: "Delivered", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

/** "Delivered" for deliveries, "Collected" for pickups. */
export const stageLabel = (o: { status: OrderStatus; fulfillment: string }) =>
  o.status === "fulfilled" && o.fulfillment === "pickup" ? "Collected" : ORDER_STAGE[o.status].label;

/** The steps an order goes through, for the timeline. */
export const stagesFor = (fulfillment: string): OrderStatus[] =>
  fulfillment === "delivery" ? ["paid", "preparing", "out_for_delivery", "fulfilled"] : ["paid", "preparing", "ready_for_pickup", "fulfilled"];

/** Hours an order may sit in a stage before it's flagged as overdue. */
export const STUCK_HOURS: Partial<Record<OrderStatus, number>> = { paid: 24, preparing: 48, ready_for_pickup: 72, out_for_delivery: 8 };
export const isStuck = (o: { status: OrderStatus; status_updated_at: string | null; paid_at: string | null }) => {
  const limit = STUCK_HOURS[o.status];
  const since = o.status_updated_at ?? o.paid_at;
  return Boolean(limit && since && Date.now() - new Date(since).getTime() > limit * 60 * 60 * 1000);
};
