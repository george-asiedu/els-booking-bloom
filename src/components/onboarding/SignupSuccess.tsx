import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarCheck2, Check, Copy, ExternalLink, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORM } from "@/config/platform";
import { formatGHS } from "@/lib/currency";
import type { SignupSummary } from "@/lib/onboardingApi";

const day = (iso: string | null) => (iso ? format(parseISO(iso), "d MMM yyyy") : "—");
const weekday = (iso: string | null) => (iso ? format(parseISO(iso), "EEEE") : "");
const displayUrl = (url: string) => url.replace(/^https?:\/\//, "").replace(/\?.*$/, "");

const CopyButton = ({ value, label }: { value: string; label: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard unavailable: the value is on screen */
        }
      }}
      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
};

/**
 * The "your studio is live" screen after signup: the studio's address, its
 * plan and what was paid, and what to do next. Confetti is fired by the page.
 */
export const SignupSuccess = ({
  summary,
  onOpenDashboard,
  onOpenSite,
}: {
  summary: SignupSummary | null;
  // Fallbacks for when the summary couldn't be loaded.
  onOpenDashboard: () => void;
  onOpenSite: () => void;
}) => {
  const planName = summary?.plan === "PREMIUM" ? "Premium" : "Standard";
  const subscription = summary?.billingMode === "SUBSCRIPTION";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-transparent px-6 pb-2 pt-10 text-center sm:px-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_0_6px_hsl(var(--primary)/0.15)]">
          <PartyPopper className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="mt-5 text-balance font-serif text-3xl font-bold">
          {summary ? `${summary.studioName} is live!` : "Your studio is live!"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-pretty text-muted-foreground">
          Welcome to {PLATFORM.name}. Sign in with the email and password you just set to add
          your services and opening hours, then start taking bookings.
        </p>
      </div>

      <div className="space-y-6 px-6 pb-8 pt-4 sm:px-10">
        {summary && (
          <>
            {/* Address */}
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground">Your booking site</p>
              <div className="mt-1 flex items-center gap-2">
                <a
                  href={summary.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 truncate font-semibold text-primary hover:underline"
                >
                  {displayUrl(summary.websiteUrl)}
                </a>
                <CopyButton value={summary.websiteUrl} label="web address" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Share it on Instagram, WhatsApp and TikTok so clients can book you.
              </p>
            </div>

            {/* Plan and period */}
            {subscription && summary.periodEnd ? (
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <CalendarCheck2 className="h-3.5 w-3.5" aria-hidden />
                  {summary.coverageMonths
                    ? `Covered by your setup fee · ${summary.coverageMonths} ${summary.coverageMonths === 1 ? "month" : "months"}`
                    : "Your first period"}
                </p>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Starts</p>
                    <p className="whitespace-nowrap font-semibold tabular-nums">{day(summary.periodStart)}</p>
                    <p className="text-xs text-muted-foreground">{weekday(summary.periodStart)}</p>
                  </div>
                  <div className="flex items-center gap-1" aria-hidden>
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="h-px w-6 bg-primary/50 sm:w-12" />
                    <span className="h-2 w-2 rounded-full border-2 border-primary" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">First renewal</p>
                    <p className="whitespace-nowrap font-semibold tabular-nums">{day(summary.periodEnd)}</p>
                    <p className="text-xs text-muted-foreground">{weekday(summary.periodEnd)}</p>
                  </div>
                </div>
              </div>
            ) : !subscription && summary.commissionPercent != null ? (
              <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                <p className="font-medium">Pay as you earn</p>
                <p className="mt-1 text-muted-foreground">
                  No monthly fee. {PLATFORM.name} keeps {summary.commissionPercent}% of each payment
                  your customers make, and there's nothing to renew.
                </p>
              </div>
            ) : null}

            {/* What was paid */}
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="font-medium">
                  {planName} · {subscription ? (summary.cadence === "YEARLY" ? "Yearly" : "Monthly") : "Pay as you earn"}
                </dd>
              </div>
              {summary.amountPaid != null && summary.amountPaid > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{subscription ? "Setup fee paid" : "Activation fee paid"}</dt>
                  <dd className="font-semibold tabular-nums">{formatGHS(summary.amountPaid)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Date</dt>
                <dd className="tabular-nums">
                  {summary.paidAt ? format(parseISO(summary.paidAt), "d MMM yyyy, h:mm a") : "Today"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Reference</dt>
                <dd className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-mono text-xs">{summary.reference}</span>
                  <CopyButton value={summary.reference} label="reference" />
                </dd>
              </div>
            </dl>
          </>
        )}

        {/* Next steps: a real sequence, so numbered. */}
        <div>
          <p className="mb-3 text-sm font-medium">Next steps</p>
          <ol className="space-y-2.5 text-sm">
            {[
              "Sign in to your dashboard",
              "Add your services, prices and opening hours",
              "Share your booking link with your clients",
            ].map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {summary ? (
            <>
              <Button asChild className="flex-1">
                <a href={summary.dashboardUrl}>Go to your dashboard</a>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <a href={summary.websiteUrl} target="_blank" rel="noopener noreferrer">
                  View your site <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
                </a>
              </Button>
            </>
          ) : (
            <>
              <Button className="flex-1" onClick={onOpenDashboard}>
                Go to your dashboard
              </Button>
              <Button variant="outline" className="flex-1" onClick={onOpenSite}>
                View your site
              </Button>
            </>
          )}
        </div>
        {summary && (
          <p className="text-center text-xs text-muted-foreground">
            We've also emailed you these details. Keep the reference in case you need to ask us
            about your payment.
          </p>
        )}
      </div>
    </div>
  );
};
