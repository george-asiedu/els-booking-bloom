import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Clock, Copy, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ordersApi, type OrderDTO, type OrderStatus } from "@/lib/api";
import { ORDER_STAGE, isStuck, stageLabel, stagesFor } from "@/lib/orderStages";
import { cn } from "@/lib/utils";

const ETA_SUGGESTIONS = ["Within 1 hour", "Today, 2–4 pm", "Today, 4–6 pm", "Tomorrow morning"];

/**
 * An order's stage with a control to move it on. Going out for delivery (or
 * ready to collect) asks for an expected time; going out returns a link for
 * the rider, shown with Copy and "Send on WhatsApp".
 */
export const OrderStageControl = ({ order, onRiderLink }: { order: OrderDTO; onRiderLink: (orderNumber: string, link: string) => void }) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [asking, setAsking] = useState<OrderStatus | null>(null);
  const [eta, setEta] = useState("");

  const move = useMutation({
    mutationFn: (v: { status: OrderStatus; eta?: string }) => ordersApi.moveStage(order.id, v.status, v.eta),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      setAsking(null);
      setEta("");
      if (r.riderLink) onRiderLink(order.order_number, r.riderLink);
      else toast({ title: `Order ${stageLabel(r.order).toLowerCase()}`, description: "The customer has been told." });
    },
    onError: (e) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Couldn't update the order" }),
  });

  const choose = (status: OrderStatus) => {
    if (status === "out_for_delivery" || status === "ready_for_pickup") {
      setEta(order.delivery_eta ?? order.delivery_slot ?? "");
      setAsking(status);
    } else move.mutate({ status });
  };

  // What can come next: the stages for this kind of order, then cancelled.
  const options: OrderStatus[] =
    order.status === "pending_payment" ? ["pending_payment", "cancelled"] : [...stagesFor(order.fulfillment), "cancelled"];
  const stuck = isStuck(order);

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", ORDER_STAGE[order.status].className)}>{stageLabel(order)}</span>
        {stuck && (
          <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-900 dark:bg-rose-500/15 dark:text-rose-300">
            <Clock className="h-3 w-3" /> Overdue
          </span>
        )}
        {order.delivery_failed_reason && order.status === "out_for_delivery" && (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-500/15 dark:text-amber-300" title={order.delivery_failed_reason}>
            <AlertTriangle className="h-3 w-3" /> Delivery failed
          </span>
        )}
      </div>
      {order.status !== "fulfilled" && order.status !== "cancelled" && (
        <Select value="" onValueChange={(v) => choose(v as OrderStatus)} disabled={move.isPending}>
          <SelectTrigger className="h-8 w-44" aria-label={`Move order ${order.order_number}`}>
            <SelectValue placeholder={move.isPending ? "Updating…" : "Move to…"} />
          </SelectTrigger>
          <SelectContent>
            {options
              .filter((s) => s !== order.status)
              .map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "fulfilled" ? (order.fulfillment === "pickup" ? "Collected" : "Delivered") : ORDER_STAGE[s].label}
                </SelectItem>
              ))}
            {order.status === "out_for_delivery" && <SelectItem value="out_for_delivery">New rider link</SelectItem>}
          </SelectContent>
        </Select>
      )}

      <Dialog open={asking !== null} onOpenChange={(o) => !o && setAsking(null)}>
        <DialogContent className="max-w-sm">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (asking) move.mutate({ status: asking, eta: eta.trim() || undefined });
            }}
          >
            <DialogHeader>
              <DialogTitle>{asking === "out_for_delivery" ? "Out for delivery" : "Ready for pickup"}</DialogTitle>
              <DialogDescription>
                {asking === "out_for_delivery"
                  ? "The customer gets a message with the expected time and their handover code. You'll get a link to send the rider."
                  : "The customer gets a message to come and collect it, with their handover code."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="eta">{asking === "out_for_delivery" ? "Expected delivery (optional)" : "Collect by (optional)"}</Label>
              <Input id="eta" maxLength={60} value={eta} onChange={(e) => setEta(e.target.value)} placeholder="e.g. Today, 2–4 pm" />
              <div className="flex flex-wrap gap-1.5">
                {ETA_SUGGESTIONS.map((t) => (
                  <button key={t} type="button" onClick={() => setEta(t)} className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-accent">
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={move.isPending}>
                {move.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {asking === "out_for_delivery" ? "Send it out" : "Mark ready"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

/**
 * The rider's link, shown after an order goes out for delivery. Kept above the
 * order list so it stays open when the order moves to another tab.
 */
export const RiderLinkDialog = ({ link, orderNumber, onClose }: { link: string | null; orderNumber: string; onClose: () => void }) => {
  const { toast } = useToast();
  const shareText = link ? `Delivery for order ${orderNumber}. Open this link for the address and to confirm delivery: ${link}` : "";
  return (
      <Dialog open={Boolean(link)} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-600" /> Order {orderNumber} is out for delivery
            </DialogTitle>
            <DialogDescription>
              Send this link to the rider. It shows the address and the customer's number, and the rider enters the customer's 4-digit code there to confirm delivery. It works for 3 days.
            </DialogDescription>
          </DialogHeader>
          <code className="block break-all rounded-lg bg-muted px-3 py-2 text-sm">{link}</code>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() =>
                navigator.clipboard.writeText(link ?? "").then(
                  () => toast({ title: "Link copied" }),
                  () => toast({ variant: "destructive", title: "Couldn't copy. Select the link instead." }),
                )
              }
            >
              <Copy className="mr-2 h-4 w-4" /> Copy link
            </Button>
            <Button asChild>
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> Send on WhatsApp
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
};

/** At the counter: type the customer's code to hand over a pickup order. */
export const PickupHandover = ({ order, onDone }: { order: OrderDTO; onDone: () => void }) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const confirm = useMutation({
    mutationFn: () => ordersApi.confirmHandover(order.id, code.trim()),
    onSuccess: () => {
      toast({ title: "Collected", description: `Order ${order.order_number} is marked as collected.` });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      onDone();
    },
    onError: (e) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "That code didn't work" }),
  });
  if (order.status !== "ready_for_pickup") return null;
  return (
    <form
      className="w-full space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        confirm.mutate();
      }}
    >
      <Label htmlFor="handover">Customer's code</Label>
      <div className="flex gap-2">
        <Input
          id="handover"
          inputMode="numeric"
          maxLength={4}
          placeholder="4 digits"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="text-center tracking-[0.4em]"
        />
        <Button type="submit" disabled={code.length !== 4 || confirm.isPending}>
          {confirm.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Hand over
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Ask the customer for the code in their order. It confirms they collected it.</p>
    </form>
  );
};
