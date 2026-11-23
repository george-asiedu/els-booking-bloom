import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { appointmentsApi, cancellationsApi, ordersApi, type AppointmentDTO, type OrderDTO } from "@/lib/api";
import { formatGHS } from "@/lib/currency";

type Props =
  | { kind: "appointments"; item: AppointmentDTO; onChanged: () => void }
  | { kind: "orders"; item: OrderDTO; onChanged: () => void };

/** What the customer paid in the app and hasn't had back. */
const paidOf = (p: Props) =>
  p.kind === "appointments"
    ? p.item.payment && (p.item.payment.status === "paid" || p.item.payment.status === "partially_refunded")
      ? p.item.payment.amount - (p.item.payment.refunded_amount ?? 0)
      : 0
    : p.item.paid_at
      ? p.item.total - (p.item.refunded_amount ?? 0)
      : 0;

/**
 * The admin's side of a cancellation: approve or decline the customer's
 * request, then, once cancelled, record the refund the business paid the
 * customer itself. No money moves through the app.
 */
export const CancellationActions = (props: Props) => {
  const { kind, item, onChanged } = props;
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const paid = Math.round(paidOf(props) * 100) / 100;
  const [amount, setAmount] = useState(String(paid));
  const [note, setNote] = useState("");
  const what = kind === "appointments" ? "booking" : "order";

  const done = (title: string, description?: string) => {
    toast({ title, description });
    qc.invalidateQueries({ queryKey: [kind === "appointments" ? "admin-appointments" : "admin-orders"] });
    onChanged();
  };
  const fail = (e: unknown) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Something went wrong" });

  const approve = useMutation({
    mutationFn: async () => {
      if (kind === "appointments") await appointmentsApi.updateStatus(item.id, "cancelled");
      else await ordersApi.updateStatus(item.id, "cancelled");
    },
    onSuccess: () =>
      done(
        `${kind === "appointments" ? "Booking" : "Order"} cancelled`,
        paid > 0 ? `Pay the customer back ${formatGHS(paid)} yourself, then mark it as refunded.` : undefined,
      ),
    onError: fail,
  });
  const decline = useMutation({
    mutationFn: () => cancellationsApi.decline(kind, item.id),
    onSuccess: (r) => done("Request declined", r.message),
    onError: fail,
  });
  const markRefunded = useMutation({
    mutationFn: () => cancellationsApi.markRefunded(kind, item.id, Number(amount), note.trim() || undefined),
    onSuccess: (r) => {
      setOpen(false);
      done("Marked as refunded", r.message);
    },
    onError: fail,
  });

  const requested = Boolean(item.cancel_requested_at) && item.status !== "cancelled";
  const canMarkRefunded = item.status === "cancelled" && !item.refunded_outside && paid > 0;
  if (!requested && !canMarkRefunded) return null;

  return (
    <div className="flex w-full flex-col gap-2">
      {requested && (
        <>
          <p className="rounded-lg bg-amber-500/10 p-3 text-sm">
            The customer asked to cancel this {what}
            {item.cancel_request_reason ? `: "${item.cancel_request_reason}"` : "."}
            {paid > 0 && ` If you approve, pay them back ${formatGHS(paid)} yourself and mark it as refunded.`}
          </p>
          <div className="flex gap-2">
            <Button className="flex-1" variant="destructive" disabled={approve.isPending} onClick={() => approve.mutate()}>
              {approve.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve cancellation
            </Button>
            <Button className="flex-1" variant="outline" disabled={decline.isPending} onClick={() => decline.mutate()}>
              Decline
            </Button>
          </div>
        </>
      )}
      {canMarkRefunded && (
        <Button variant="outline" onClick={() => setOpen(true)}>
          <BadgeCheck className="mr-2 h-4 w-4" /> Mark as refunded
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              markRefunded.mutate();
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>Mark as refunded</DialogTitle>
              <DialogDescription>
                Record the money you paid back to the customer yourself (Mobile Money, cash or bank). We'll let them know by email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Amount refunded (GHS)</Label>
              <Input id="refund-amount" type="number" inputMode="decimal" min={0.01} max={paid} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <p className="text-xs text-muted-foreground">They paid {formatGHS(paid)} in the app.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-note">How you paid them (optional)</Label>
              <Input id="refund-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. MoMo to 024 000 0000" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={markRefunded.isPending || !(Number(amount) > 0) || Number(amount) > paid}>
                {markRefunded.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Mark as refunded
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
