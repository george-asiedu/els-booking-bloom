import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Check, Copy, PartyPopper, CalendarCheck2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { RenewalReceiptDTO } from "@/lib/api";
import { celebrate } from "@/lib/confetti";
import { formatGHS } from "@/lib/currency";

const day = (iso: string | null) => (iso ? format(parseISO(iso), "d MMM yyyy") : "—");
const weekday = (iso: string | null) => (iso ? format(parseISO(iso), "EEEE") : "");

/**
 * Shown once a renewal has gone through: confetti, then the new period as a
 * start → end timeline and what was paid. A studio coming back from a lapsed
 * plan gets a welcome-back message, since their site is live again.
 */
export const RenewalSuccessDialog = ({
  receipt,
  wasLapsed,
  onClose,
}: {
  receipt: RenewalReceiptDTO | null;
  wasLapsed: boolean;
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!receipt) return;
    setCopied(false);
    // After the dialog has painted, so the burst lands on it.
    const t = setTimeout(celebrate, 150);
    return () => clearTimeout(t);
  }, [receipt]);

  if (!receipt) return null;

  const planName = receipt.plan === "PREMIUM" ? "Premium" : "Standard";
  const period = receipt.cadence === "YEARLY" ? "1 year" : "1 month";
  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(receipt.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable: the reference is still on screen */
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-md overflow-hidden p-0"
        // Start on "Done", not the first small control in the dialog.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).querySelector<HTMLElement>("[data-autofocus]")?.focus();
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-b from-primary/10 to-transparent px-6 pb-2 pt-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_0_6px_hsl(var(--primary)/0.15)]">
            {wasLapsed ? <PartyPopper className="h-7 w-7" aria-hidden /> : <Check className="h-7 w-7" aria-hidden />}
          </div>
          <DialogTitle className="mt-5 text-2xl font-bold">
            {wasLapsed ? "Welcome back!" : "Your plan is renewed"}
          </DialogTitle>
          <DialogDescription className="mx-auto mt-2 max-w-xs text-pretty">
            {wasLapsed
              ? "Your studio is live again. Customers can book and pay on your site right away."
              : `Thanks! Your ${planName} plan now runs for another ${receipt.cadence === "YEARLY" ? "year" : "month"}.`}
          </DialogDescription>
        </div>

        <div className="space-y-5 px-6 pb-6 pt-4">
          {/* The new period */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CalendarCheck2 className="h-3.5 w-3.5" aria-hidden /> Your new period · {period}
            </p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Starts</p>
                <p className="whitespace-nowrap font-semibold tabular-nums">{day(receipt.periodStart)}</p>
                <p className="text-xs text-muted-foreground">{weekday(receipt.periodStart)}</p>
              </div>
              <div className="flex items-center gap-1 text-primary" aria-hidden>
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="h-px w-6 bg-primary/50 sm:w-12" />
                <span className="h-2 w-2 rounded-full border-2 border-primary" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Renews on</p>
                <p className="whitespace-nowrap font-semibold tabular-nums">{day(receipt.periodEnd)}</p>
                <p className="text-xs text-muted-foreground">{weekday(receipt.periodEnd)}</p>
              </div>
            </div>
          </div>

          {/* What was paid */}
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Plan</dt>
              <dd className="font-medium">
                {planName} · {receipt.cadence === "YEARLY" ? "Yearly" : "Monthly"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Amount paid</dt>
              <dd className="font-semibold tabular-nums">{formatGHS(receipt.amount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Paid on</dt>
              <dd className="tabular-nums">
                {receipt.paidAt ? format(parseISO(receipt.paidAt), "d MMM yyyy, h:mm a") : "Today"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Reference</dt>
              <dd className="flex min-w-0 items-center gap-1.5">
                <span className="truncate font-mono text-xs">{receipt.reference}</span>
                <button
                  type="button"
                  onClick={copyRef}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label={copied ? "Reference copied" : "Copy reference"}
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </dd>
            </div>
          </dl>

          <p className="rounded-lg bg-muted/50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            We'll email you before {day(receipt.periodEnd)} so you can renew in time. Keep the
            reference above if you ever need to ask us about this payment.
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" asChild>
              <Link to="/admin" onClick={onClose}>
                Go to dashboard
              </Link>
            </Button>
            <Button onClick={onClose} data-autofocus>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
