import { Check } from "lucide-react";
import type { OrderDTO } from "@/lib/api";
import { ORDER_STAGE, stagesFor } from "@/lib/orderStages";
import { cn } from "@/lib/utils";

/**
 * Where a paid order is, as steps: Paid, Preparing, Out for delivery (or
 * Ready for pickup), Delivered (or Collected). With the expected time and,
 * once it's out or ready, the code to give at the handover.
 */
export const OrderTimeline = ({ order }: { order: OrderDTO }) => {
  if (order.status === "pending_payment" || order.status === "cancelled") return null;
  const steps = stagesFor(order.fulfillment);
  const at = steps.indexOf(order.status);
  const label = (s: (typeof steps)[number]) =>
    s === "fulfilled" ? (order.fulfillment === "pickup" ? "Collected" : "Delivered") : ORDER_STAGE[s].label;
  const showCode = order.handover_code && (order.status === "out_for_delivery" || order.status === "ready_for_pickup");

  return (
    <div className="space-y-4 bg-background p-4">
      <ol className="grid grid-cols-4 gap-1">
        {steps.map((s, i) => {
          const done = i <= at;
          return (
            <li key={s} className="flex flex-col items-center text-center">
              <span className="flex w-full items-center">
                <span className={cn("h-0.5 flex-1", i === 0 ? "bg-transparent" : i <= at ? "bg-primary" : "bg-border")} />
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs",
                    done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={cn("h-0.5 flex-1", i === steps.length - 1 ? "bg-transparent" : i < at ? "bg-primary" : "bg-border")} />
              </span>
              <span className={cn("mt-1.5 text-[11px] leading-tight", i === at ? "font-semibold" : "text-muted-foreground")}>{label(s)}</span>
            </li>
          );
        })}
      </ol>
      {order.delivery_eta && order.status !== "fulfilled" && (
        <p className="text-sm">
          {order.fulfillment === "pickup" ? "Collect by" : "Expected"}: <span className="font-medium">{order.delivery_eta}</span>
        </p>
      )}
      {order.delivery_failed_reason && order.status === "out_for_delivery" && (
        <p className="rounded-lg bg-amber-500/10 p-3 text-sm">
          The rider couldn't deliver: {order.delivery_failed_reason}. The shop will be in touch to arrange another time.
        </p>
      )}
      {showCode && (
        <div className="rounded-xl border border-dashed border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">
            {order.fulfillment === "pickup" ? "Show this code when you collect your order" : "Give this code to the rider when your order arrives"}
          </p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-[0.5em]">{order.handover_code}</p>
        </div>
      )}
    </div>
  );
};
