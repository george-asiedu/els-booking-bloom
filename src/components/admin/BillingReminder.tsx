import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { studioBillingApi, StudioBillingDTO } from "@/lib/api";
import { cn } from "@/lib/utils";

// Days from now until the period ends (negative once lapsed, null if unknown).
const daysLeft = (b?: StudioBillingDTO): number | null => {
  if (!b?.currentPeriodEnd) return null;
  const ms = new Date(b.currentPeriodEnd).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

const useBilling = () =>
  useQuery({
    queryKey: ["studio-billing"],
    queryFn: () => studioBillingApi.get(),
    // Keep it fresh-ish so the countdown reflects a renewal without a reload.
    staleTime: 5 * 60 * 1000,
  });

// Compact always-on indicator for the header: shows the plan and days remaining.
export const BillingBadge = () => {
  const { data: b } = useBilling();
  if (!b) return null;
  const revShare = b.billingMode === "REVENUE_SHARE";
  const d = daysLeft(b);
  const warn = !revShare && (b.lapsed || (d !== null && d <= 2));
  return (
    <Link
      to="/admin/billing"
      className={cn(
        "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex",
        warn
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
      title="Billing & plan"
    >
      <CalendarClock className="h-3.5 w-3.5" />
      {b.plan === "PREMIUM" ? "Premium" : "Standard"}
      {" · "}
      {revShare
        ? `${b.commissionPercent}% per sale`
        : b.lapsed
          ? "Lapsed"
          : d === null
            ? "—"
            : d <= 0
              ? "Ends today"
              : `${d} day${d === 1 ? "" : "s"} left`}
    </Link>
  );
};

// Full-width scrolling reminder shown across the dashboard when a plan is within
// 2 days of ending or already lapsed. Links to the billing page to renew.
export const BillingMarquee = () => {
  const { data: b } = useBilling();
  if (!b) return null;
  const d = daysLeft(b);
  const show = b.lapsed || (d !== null && d <= 2);
  if (!show) return null;

  const message = b.lapsed
    ? "Your plan has lapsed — your studio may be unavailable to customers. Renew now to restore it."
    : d !== null && d <= 0
      ? "Your plan ends today. Renew now to avoid interruption."
      : `Your plan ends in ${d} day${d === 1 ? "" : "s"}. Renew now to avoid interruption.`;
  const item = `${message}  •  Tap to renew  •  `;

  return (
    <Link
      to="/admin/billing"
      className="marquee-viewport block shrink-0 overflow-hidden border-b border-destructive/30 bg-destructive/10 py-1.5 text-sm font-medium text-destructive"
    >
      <span className="marquee-track">
        {[0, 1].map((i) => (
          <span key={i} className="inline-flex items-center gap-2 px-4">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {item}
          </span>
        ))}
      </span>
    </Link>
  );
};
