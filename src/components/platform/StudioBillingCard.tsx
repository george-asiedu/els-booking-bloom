import { format, parseISO } from "date-fns";
import { CalendarCheck2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EarningEntry, StudioBillingSummary } from "@/lib/platformApi";
import { PURPOSE_LABEL } from "@/lib/earnings";
import { formatGHS } from "@/lib/currency";
import { cn } from "@/lib/utils";

const day = (iso: string | null | undefined) => (iso ? format(parseISO(iso), "d MMM yyyy") : "—");

/** A studio's plan, paid period and payment history, on its platform page. */
export const StudioBillingCard = ({
  billing,
  onOpenPayment,
}: {
  billing: StudioBillingSummary;
  onOpenPayment: (entry: EarningEntry) => void;
}) => {
  const sub = billing.mode === "SUBSCRIPTION";
  const planName = billing.plan === "PREMIUM" ? "Premium" : "Standard";
  const lapsed = billing.status === "lapsed";
  const daysLeft = billing.daysLeft ?? 0;

  return (
    <Card className={cn("mb-6", lapsed && "border-destructive/60")}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-base">Plan & billing</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant={billing.plan === "PREMIUM" ? "default" : "secondary"}>{planName}</Badge>
          <Badge variant="outline">
            {sub ? (billing.cadence === "YEARLY" ? "Yearly" : "Monthly") : `Pay as you earn · ${billing.commissionPercent}%`}
          </Badge>
          <Badge variant={lapsed ? "destructive" : "secondary"}>
            {lapsed ? "Lapsed" : sub ? "Active" : "No renewals"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        {sub ? (
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CalendarCheck2 className="h-3.5 w-3.5" aria-hidden /> Current period
            </p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Last paid on</p>
                <p className="font-semibold tabular-nums">{day(billing.currentPeriodStart)}</p>
              </div>
              <div className="flex items-center gap-1" aria-hidden>
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="h-px w-8 bg-primary/50 sm:w-14" />
                <span className="h-2 w-2 rounded-full border-2 border-primary" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{lapsed ? "Expired on" : "Paid up to"}</p>
                <p className={cn("font-semibold tabular-nums", lapsed && "text-destructive")}>
                  {day(billing.currentPeriodEnd)}
                </p>
              </div>
            </div>
            <p className={cn("mt-3 text-sm", lapsed ? "text-destructive" : "text-muted-foreground")}>
              {billing.currentPeriodEnd
                ? lapsed
                  ? `Lapsed ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? "day" : "days"} ago. Their site may be unavailable until they renew.`
                  : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left. They'll be reminded by email before it ends.`
                : "No paid period yet."}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border bg-muted/30 p-4 text-sm">
            <p className="font-medium">Pay as you earn</p>
            <p className="mt-1 text-muted-foreground">
              No plan fee or renewals. You receive {billing.commissionPercent}% of each customer
              payment through their Paystack split.
            </p>
          </div>
        )}

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Signed up with</dt>
            <dd className="text-right">
              {billing.signup
                ? `${formatGHS(billing.signup.amount)}${billing.signup.coverageMonths ? ` · covered ${billing.signup.coverageMonths} months` : ""}`
                : "Created by you (no signup payment)"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Last payment</dt>
            <dd className="text-right">
              {billing.lastPayment ? (
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => onOpenPayment(billing.lastPayment!)}
                >
                  {formatGHS(billing.lastPayment.amount)} · {PURPOSE_LABEL[billing.lastPayment.purpose]} ·{" "}
                  {day(billing.lastPayment.date)}
                </button>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Total paid to you</dt>
            <dd className="font-semibold tabular-nums">{formatGHS(billing.totalPaid)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Payments</dt>
            <dd className="tabular-nums">{billing.payments.length}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
};
