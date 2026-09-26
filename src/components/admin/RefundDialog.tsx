import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { refundsApi } from "@/lib/api";
import { formatGHS } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";

export interface RefundTarget {
  kind: "payment" | "order";
  id: string;
  // What the customer actually paid, and what has already been sent back.
  paid: number;
  alreadyRefunded?: number;
  label: string; // "Ama Mensah — Kinky Locks" / "Order ORD-1042"
}

/**
 * Issues a refund against a booking payment or a shop order.
 *
 * The remaining-refundable figure shown here is advisory: the server owns the
 * real ceiling and re-checks it, so a stale screen can't over-refund. Leaving
 * the amount on "full" sends no amount at all and lets the server refund
 * whatever is actually left.
 */
export const RefundDialog = ({
  target,
  onOpenChange,
  invalidateKeys = [],
}: {
  target: RefundTarget | null;
  onOpenChange: (open: boolean) => void;
  invalidateKeys?: string[];
}) => {
  const [mode, setMode] = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const refundable = target
    ? Math.max(
        0,
        Math.round((target.paid - (target.alreadyRefunded ?? 0)) * 100) / 100,
      )
    : 0;

  const reset = () => {
    setMode("full");
    setAmount("");
    setReason("");
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!target) throw new Error("Nothing selected");
      const body = {
        ...(mode === "partial" ? { amount: Number(amount) } : {}),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      };
      return target.kind === "payment"
        ? refundsApi.refundPayment(target.id, body)
        : refundsApi.refundOrder(target.id, body);
    },
    onSuccess: (res) => {
      toast({ title: "Refund submitted", description: res.message });
      for (const k of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: [k] });
      }
      reset();
      onOpenChange(false);
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "Refund not processed",
        description: err instanceof Error ? err.message : "Please try again.",
      }),
  });

  const partialAmount = Number(amount);
  const partialInvalid =
    mode === "partial" &&
    (!amount.trim() ||
      !Number.isFinite(partialAmount) ||
      partialAmount <= 0 ||
      partialAmount > refundable);

  return (
    <Dialog
      open={!!target}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Refund this payment</DialogTitle>
          <DialogDescription>
            {target ? (
              <>
                {target.label} — {formatGHS(refundable)} available to refund
                {target.alreadyRefunded
                  ? ` (${formatGHS(target.alreadyRefunded)} already refunded)`
                  : ""}
                .
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {refundable <= 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            This has already been fully refunded, so there's nothing left to
            send back.
          </p>
        ) : (
          <div className="space-y-4">
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as "full" | "partial")}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="full" id="refund-full" />
                <Label htmlFor="refund-full" className="font-normal">
                  Refund everything left ({formatGHS(refundable)})
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="partial" id="refund-partial" />
                <Label htmlFor="refund-partial" className="font-normal">
                  Refund part of it
                </Label>
              </div>
            </RadioGroup>

            {mode === "partial" ? (
              <div className="space-y-1">
                <Label htmlFor="refund-amount">Amount (GHS)</Label>
                <Input
                  id="refund-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={String(refundable)}
                  aria-invalid={partialInvalid}
                />
                {partialInvalid && amount.trim() ? (
                  <p className="text-xs text-destructive">
                    Enter an amount between 0 and {formatGHS(refundable)}.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-1">
              <Label htmlFor="refund-reason">Reason (optional)</Label>
              <Textarea
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Shown to the customer on their refund receipt."
                rows={2}
                maxLength={300}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              The money goes back the way it was paid and usually lands within
              5–10 business days. The customer is emailed a refund receipt once
              it completes.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || refundable <= 0 || partialInvalid}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refunding…
              </>
            ) : (
              "Refund"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
