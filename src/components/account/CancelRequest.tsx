import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cancellationsApi } from "@/lib/api";
import { formatGHS } from "@/lib/currency";

/**
 * "Ask to cancel" for a customer's booking or paid order. The business
 * decides; if they approve and the customer had paid, the business pays them
 * back directly.
 */
export const CancelRequestButton = ({
  kind,
  id,
  paid,
  invalidate,
  onDone,
}: {
  kind: "appointments" | "orders";
  id: string;
  /** What the customer paid in the app, to explain how a refund works. */
  paid: number;
  invalidate: string[];
  onDone?: () => void;
}) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const what = kind === "appointments" ? "booking" : "order";
  const send = useMutation({
    mutationFn: () => cancellationsApi.request(kind, id, reason.trim() || undefined),
    onSuccess: (r) => {
      toast({ title: "Cancellation requested", description: r.message });
      invalidate.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      setOpen(false);
      onDone?.();
    },
    onError: (e) => toast({ variant: "destructive", title: "Couldn't send your request", description: e instanceof Error ? e.message : undefined }),
  });

  return (
    <>
      <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
        <XCircle className="mr-2 h-4 w-4" /> Ask to cancel
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ask to cancel this {what}</DialogTitle>
            <DialogDescription>
              {paid > 0
                ? `We'll ask the business to cancel it. If they agree, they'll refund the ${formatGHS(paid)} you paid directly to you.`
                : "We'll ask the business to cancel it. You'll be told when they decide."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason (optional)</Label>
            <Textarea id="cancel-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Let them know why" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Keep it
            </Button>
            <Button variant="destructive" disabled={send.isPending} onClick={() => send.mutate()}>
              {send.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

/** Detail rows for a pending request or a recorded refund, if either exists. */
export const cancellationRows = (item: {
  cancel_requested_at: string | null;
  cancel_request_reason: string | null;
  refunded_outside: { amount: number; note: string | null } | null;
  status: string;
}) => [
  ...(item.cancel_requested_at && item.status !== "cancelled"
    ? [
        { label: "Cancellation", value: "Requested, waiting for the business" },
        ...(item.cancel_request_reason ? [{ label: "Reason", value: item.cancel_request_reason }] : []),
      ]
    : []),
  ...(item.refunded_outside
    ? [
        { label: "Refunded", value: formatGHS(item.refunded_outside.amount) },
        ...(item.refunded_outside.note ? [{ label: "Refund note", value: item.refunded_outside.note }] : []),
      ]
    : []),
];
