import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Lock, Loader2, MessageCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardHeading, KpiTile, Panel } from "@/components/dashboard/KpiTile";
import { Button } from "@/components/ui/button";
import { useStudio } from "@/hooks/useStudio";
import { apiRequest } from "@/lib/apiClient";
import { formatGHS } from "@/lib/currency";
import { whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface Finding {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  impact: { amount: number; per: string } | null;
  items: { label: string; sub?: string; phone?: string; firstName?: string; href?: string }[];
  action: { label: string; href: string };
}
interface Insights {
  period: { days: number };
  money: { revenue: number; revenueChange: number | null; expenses: number; expensesChange: number | null; profit: number; profitPrevious: number; bookings: number; orders: number; newCustomers: number; owed: number };
  findings: Finding[];
  earners: {
    services: { name: string; count: number; revenue: number; perHour: number | null }[];
    products: { name: string; units: number; revenue: number; profit: number }[];
  };
  thin: boolean;
}
interface Reply {
  data: Insights | null;
  locked?: boolean;
  message?: string;
}

const SEVERITY = {
  high: { label: "Act now", dot: "bg-rose-500", chip: "bg-rose-100 text-rose-900 dark:bg-rose-500/15 dark:text-rose-300" },
  medium: { label: "Worth doing", dot: "bg-amber-500", chip: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300" },
  low: { label: "When you can", dot: "bg-sky-500", chip: "bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-300" },
} as const;

const Change = ({ value, goodWhenUp = true }: { value: number | null; goodWhenUp?: boolean }) => {
  if (value === null) return <span>No earlier figure to compare</span>;
  const up = value >= 0;
  const good = up === goodWhenUp;
  return (
    <span className={cn("inline-flex items-center gap-0.5", good ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400")}>
      {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {Math.abs(value)}% vs the period before
    </span>
  );
};

/** Shown on Standard: what Insights does, and the way to get it. */
const Locked = () => (
  <div className="mx-auto max-w-xl rounded-2xl border border-border p-8 text-center">
    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary"><Lock className="h-5 w-5" /></div>
    <h2 className="mt-4 text-xl font-semibold">Business insights come with Premium</h2>
    <p className="mt-2 text-muted-foreground">
      Instead of charts to decode, Insights tells you what to do next: which regular customers have gone quiet, which days next week will be empty, what's about to run out, which orders are late, who owes you, and what really earns you the most.
    </p>
    <ul className="mx-auto mt-4 max-w-sm space-y-1.5 text-left text-sm">
      {["Customers to win back, with a WhatsApp message ready", "Quiet days to fill before they happen", "Stock to reorder and stock that isn't selling", "Real profit and your best earners"].map((t) => (
        <li key={t} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t}</li>
      ))}
    </ul>
    <Button asChild className="mt-6"><Link to="/admin/billing">See Premium</Link></Button>
  </div>
);

/** What's happening in the business and what to do about it. */
const AdminInsights = () => {
  const { name: business } = useStudio();
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const { data: reply, isLoading } = useQuery({
    queryKey: ["insights", days],
    queryFn: () => apiRequest<Reply>(`/insights?days=${days}`, { auth: true }),
    staleTime: 5 * 60_000,
  });
  const d = reply?.data ?? null;

  return (
    <AdminLayout>
      <DashboardHeading
        title="Insights"
        subtitle="What's happening in your business, and what to do about it."
        actions={
          !reply?.locked && (
            <div className="inline-flex rounded-lg border border-border p-0.5" role="group" aria-label="Period">
              {([7, 30, 90] as const).map((n) => (
                <button key={n} type="button" aria-pressed={days === n} onClick={() => setDays(n)} className={cn("rounded-md px-3 py-1.5 text-sm", days === n ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {n} days
                </button>
              ))}
            </div>
          )
        }
      />
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : reply?.locked ? (
        <Locked />
      ) : !d ? null : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile tone="green" label="Money in" value={formatGHS(d.money.revenue)} hint={<Change value={d.money.revenueChange} />} />
            <KpiTile tone="rose" label="Spent" value={formatGHS(d.money.expenses)} hint={<Change value={d.money.expensesChange} goodWhenUp={false} />} />
            <KpiTile tone={d.money.profit >= 0 ? "blue" : "amber"} label="Profit" value={formatGHS(d.money.profit)} hint={`Last period: ${formatGHS(d.money.profitPrevious)}`} />
            <KpiTile tone="amber" label="Waiting to be paid" value={formatGHS(d.money.owed)} hint="Unpaid bills" />
          </div>

          {d.thin && (
            <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
              There isn't much activity yet, so some insights need more history before they can say anything useful. They appear here by themselves as bookings and orders come in. Log your costs on the <Link to="/admin/expenses" className="underline underline-offset-2">Expenses</Link> page so profit is real.
            </p>
          )}

          <section aria-labelledby="attention">
            <h2 id="attention" className="mb-3 flex items-center gap-2 text-lg font-semibold"><Sparkles className="h-5 w-5 text-primary" /> Needs your attention</h2>
            {d.findings.length === 0 ? (
              <Panel>
                <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Nothing needs attention right now. We check again as bookings, orders and stock change.</p>
              </Panel>
            ) : (
              <div className="space-y-4">
                {d.findings.map((f) => (
                  <Panel key={f.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn("h-2.5 w-2.5 rounded-full", SEVERITY[f.severity].dot)} aria-hidden />
                          <h3 className="font-semibold">{f.title}</h3>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", SEVERITY[f.severity].chip)}>{SEVERITY[f.severity].label}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{f.detail}</p>
                      </div>
                      {f.impact && (
                        <div className="text-right">
                          <p className="text-lg font-semibold tabular-nums">about {formatGHS(f.impact.amount)}</p>
                          <p className="text-xs text-muted-foreground">{f.impact.per}</p>
                        </div>
                      )}
                    </div>
                    {f.items.length > 0 && (
                      <ul className="mt-3 divide-y divide-border rounded-lg border border-border text-sm">
                        {f.items.map((it, i) => {
                          const wa = it.phone ? whatsappLink(it.phone, f.id === "quiet-regulars" ? `Hi ${it.firstName}, it's been a while since your last visit to ${business}. We'd love to see you again! You can book anytime at ${window.location.origin}/book` : f.id === "unpaid-bills" ? `Hi ${it.firstName}, a reminder about your bill from ${business}. You can pay it any time by Mobile Money or card. Thank you!` : `Hi ${it.firstName}, this is ${business}.`) : null;
                          return (
                            <li key={`${it.label}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2">
                              <span className="min-w-0">
                                <span className="block truncate font-medium">{it.label}</span>
                                {it.sub && <span className="block text-xs text-muted-foreground">{it.sub}</span>}
                              </span>
                              {wa && (
                                <Button asChild size="sm" variant="outline" className="shrink-0">
                                  <a href={wa} target="_blank" rel="noreferrer"><MessageCircle className="mr-1.5 h-3.5 w-3.5" /> WhatsApp</a>
                                </Button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <Button asChild className="mt-3" size="sm"><Link to={f.action.href}>{f.action.label}</Link></Button>
                  </Panel>
                ))}
              </div>
            )}
          </section>

          {(d.earners.services.length > 0 || d.earners.products.length > 0) && (
            <section aria-labelledby="earners">
              <h2 id="earners" className="mb-3 text-lg font-semibold">What earns you the most (last 90 days)</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {d.earners.services.length > 0 && (
                  <Panel>
                    <h3 className="font-medium">Services, by money per hour of work</h3>
                    <p className="text-xs text-muted-foreground">A long service that pays well can still earn less per hour than a quick one.</p>
                    <ul className="mt-3 divide-y divide-border text-sm">
                      {d.earners.services.map((s) => (
                        <li key={s.name} className="flex items-center justify-between gap-3 py-2">
                          <span className="min-w-0"><span className="block truncate font-medium">{s.name}</span><span className="text-xs text-muted-foreground">{s.count} done, {formatGHS(s.revenue)} in total</span></span>
                          <span className="shrink-0 tabular-nums">{s.perHour !== null ? `${formatGHS(s.perHour)} / hour` : "length not set"}</span>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                )}
                {d.earners.products.length > 0 && (
                  <Panel>
                    <h3 className="font-medium">Products, by profit</h3>
                    <p className="text-xs text-muted-foreground">Profit uses the cost price you entered. Add cost prices for the full picture.</p>
                    <ul className="mt-3 divide-y divide-border text-sm">
                      {d.earners.products.map((p) => (
                        <li key={p.name} className="flex items-center justify-between gap-3 py-2">
                          <span className="min-w-0"><span className="block truncate font-medium">{p.name}</span><span className="text-xs text-muted-foreground">{p.units} sold, {formatGHS(p.revenue)} in sales</span></span>
                          <span className="shrink-0 tabular-nums">{formatGHS(p.profit)} profit</span>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminInsights;
