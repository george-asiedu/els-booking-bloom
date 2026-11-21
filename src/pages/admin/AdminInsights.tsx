import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Lock, Loader2, MessageCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardHeading, KpiTile, Panel } from "@/components/dashboard/KpiTile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
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
  customers: null | {
    total: number; newInPeriod: number; returningInPeriod: number; repeatRate: number | null; retained90: number | null; retainedCohort: number;
    top: { name: string; visits: number; spend: number }[];
  };
  capacity: null | {
    hours: number[]; grid: number[][]; busiest: { day: string; hour: number; count: number }[];
    busiestDay: { day: string; share: number } | null; quietDay: { day: string; share: number } | null;
    staff: { name: string; count: number; revenue: number; share: number }[];
  };
  promos: {
    sales: { name: string; percentOff: number; days: number; perSaleDay: number; usualPerDay: number; uplift: number | null }[];
    coupons: { code: string; uses: number; discount: number; revenue: number; avgOrder: number }[];
    shopAvgOrder: number;
    giftCards: { outstanding: number; count: number };
  };
  goal: { target: number | null; monthToDate: number; daysLeft: number; projected: number | null; bookedAhead: number; status: "ahead" | "close" | "behind" | null; neededPerDay: number | null };
}
interface InsightSettings { goal: number | null; weeklyDigest: boolean; alerts: boolean }
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

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "am" : "pm"}`;
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The month against the owner's goal, and what each remaining day needs to bring in. */
const GoalCard = ({ d }: { d: Insights }) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const g = d.goal;
  const save = useMutation({
    mutationFn: (goal: number | null) => apiRequest("/insights/settings", { method: "PUT", auth: true, body: { goal } }),
    onSuccess: () => { setValue(""); qc.invalidateQueries({ queryKey: ["insights"] }); toast({ title: "Goal saved" }); },
    onError: (e) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Couldn't save the goal" }),
  });
  const pct = g.target ? Math.min(100, (g.monthToDate / g.target) * 100) : 0;
  const tone = g.status === "ahead" ? "text-emerald-700 dark:text-emerald-400" : g.status === "close" ? "text-amber-700 dark:text-amber-400" : "text-rose-700 dark:text-rose-400";
  return (
    <Panel>
      <h3 className="font-semibold">This month against your goal</h3>
      {g.target ? (
        <>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <p className="text-2xl font-semibold tabular-nums">{formatGHS(g.monthToDate)}</p>
            <p className="text-sm text-muted-foreground">of {formatGHS(g.target)}</p>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to your monthly goal">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <p className={cn("mt-3 text-sm font-medium", tone)}>
            {g.projected === null
              ? "Too early in the month to call the pace."
              : g.status === "ahead"
                ? `On pace for ${formatGHS(g.projected)}. You're ahead of your goal.`
                : `On pace for ${formatGHS(g.projected)}, which is ${formatGHS(Math.max(0, g.target - g.projected))} short.`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {g.daysLeft} {g.daysLeft === 1 ? "day" : "days"} left{g.neededPerDay !== null && g.monthToDate < g.target ? `. You need about ${formatGHS(g.neededPerDay)} a day to get there` : ""}.
            {g.bookedAhead > 0 && ` ${formatGHS(g.bookedAhead)} is already booked for the rest of the month.`}
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">Set what you want to take in this month and we'll show whether you're on pace, and what each remaining day needs to bring in.</p>
      )}
      <form className="mt-4 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); const n = Number(value); if (n > 0) save.mutate(n); }}>
        <div className="space-y-1">
          <Label htmlFor="goal" className="text-xs">{g.target ? "Change the goal (GHS)" : "Monthly goal (GHS)"}</Label>
          <Input id="goal" type="number" min={1} step="1" className="h-9 w-36" placeholder={g.target ? String(g.target) : "e.g. 5000"} value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <Button type="submit" size="sm" variant="outline" disabled={save.isPending || !(Number(value) > 0)}>Save</Button>
        {g.target && <Button type="button" size="sm" variant="ghost" onClick={() => save.mutate(null)}>Remove goal</Button>}
      </form>
    </Panel>
  );
};

/** The weekly email and urgent alerts: on by default, easy to turn off. */
const DeliveryCard = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data } = useQuery({ queryKey: ["insight-settings"], queryFn: async () => (await apiRequest<{ data: InsightSettings }>("/insights/settings", { auth: true })).data });
  const save = useMutation({
    mutationFn: (body: Partial<{ weeklyDigest: boolean; alerts: boolean }>) => apiRequest("/insights/settings", { method: "PUT", auth: true, body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insight-settings"] }),
    onError: (e) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Couldn't save" }),
  });
  if (!data) return null;
  return (
    <Panel>
      <h3 className="font-semibold">Get it without opening the app</h3>
      <div className="mt-3 space-y-3 text-sm">
        <div className="flex items-start justify-between gap-4">
          <div><Label htmlFor="digest" className="font-medium">Monday email</Label><p className="text-muted-foreground">Last week in numbers and the top three things to do, every Monday morning.</p></div>
          <Switch id="digest" checked={data.weeklyDigest} onCheckedChange={(v) => save.mutate({ weeklyDigest: v })} />
        </div>
        <div className="flex items-start justify-between gap-4">
          <div><Label htmlFor="alerts" className="font-medium">Urgent alerts</Label><p className="text-muted-foreground">A notification only for things that can't wait: a product sold out, orders very late, bills long unpaid. At most once a week each.</p></div>
          <Switch id="alerts" checked={data.alerts} onCheckedChange={(v) => save.mutate({ alerts: v })} />
        </div>
      </div>
    </Panel>
  );
};

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

          <section aria-labelledby="pace" className="grid gap-4 lg:grid-cols-2">
            <h2 id="pace" className="sr-only">Goal and delivery</h2>
            <GoalCard d={d} />
            <DeliveryCard />
          </section>

          {d.customers && (
            <section aria-labelledby="customers">
              <h2 id="customers" className="mb-3 text-lg font-semibold">Your customers</h2>
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <Panel>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div><dt className="text-muted-foreground">New in the last {d.period.days} days</dt><dd className="text-2xl font-semibold tabular-nums">{d.customers.newInPeriod}</dd></div>
                    <div><dt className="text-muted-foreground">Came back</dt><dd className="text-2xl font-semibold tabular-nums">{d.customers.returningInPeriod}</dd></div>
                    <div><dt className="text-muted-foreground">Have come more than once</dt><dd className="text-2xl font-semibold tabular-nums">{d.customers.repeatRate}%</dd></div>
                    <div>
                      <dt className="text-muted-foreground">Back within 90 days</dt>
                      <dd className="text-2xl font-semibold tabular-nums">{d.customers.retained90 !== null ? `${d.customers.retained90}%` : "Not enough yet"}</dd>
                      {d.customers.retained90 !== null && <dd className="text-xs text-muted-foreground">of {d.customers.retainedCohort} people who first came 3 to 6 months ago</dd>}
                    </div>
                  </dl>
                </Panel>
                <Panel>
                  <h3 className="font-medium">Your best customers (last year)</h3>
                  <ul className="mt-2 divide-y divide-border text-sm">
                    {d.customers.top.map((c) => (
                      <li key={c.name} className="flex items-center justify-between gap-3 py-2"><span className="min-w-0 truncate">{c.name}<span className="text-xs text-muted-foreground"> · {c.visits} {c.visits === 1 ? "visit" : "visits"}</span></span><span className="shrink-0 tabular-nums">{formatGHS(c.spend)}</span></li>
                    ))}
                  </ul>
                </Panel>
              </div>
            </section>
          )}

          {d.capacity && (
            <section aria-labelledby="busy">
              <h2 id="busy" className="mb-3 text-lg font-semibold">When you're busy (last 90 days)</h2>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <Panel>
                  <p className="text-sm text-muted-foreground">
                    {d.capacity.busiestDay && <>Your busiest day is <strong className="text-foreground">{d.capacity.busiestDay.day}</strong> ({d.capacity.busiestDay.share}% of bookings). </>}
                    {d.capacity.quietDay && <>The quietest is <strong className="text-foreground">{d.capacity.quietDay.day}</strong> ({d.capacity.quietDay.share}%). A promotion there fills the gap.</>}
                  </p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full border-separate border-spacing-1 text-center text-xs" aria-label="Bookings by day and hour">
                      <thead><tr><th scope="col" className="w-10" />{d.capacity.hours.map((h) => <th key={h} scope="col" className="font-normal text-muted-foreground">{hourLabel(h)}</th>)}</tr></thead>
                      <tbody>
                        {DAY_ORDER.map((di) => {
                          const row = d.capacity!.grid[di]!;
                          const max = Math.max(1, ...d.capacity!.grid.flat());
                          return (
                            <tr key={di}>
                              <th scope="row" className="pr-1 text-left font-normal text-muted-foreground">{DAY_NAMES[di]}</th>
                              {row.map((n, i) => (
                                <td key={i} title={`${DAY_NAMES[di]} ${hourLabel(d.capacity!.hours[i]!)}: ${n} ${n === 1 ? "booking" : "bookings"}`} className="h-7 rounded" style={{ backgroundColor: n ? `hsl(var(--primary) / ${0.15 + (n / max) * 0.85})` : "hsl(var(--muted))" }}>
                                  {n || ""}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Panel>
                {d.capacity.staff.length > 0 && (
                  <Panel>
                    <h3 className="font-medium">Your team (completed bookings)</h3>
                    <ul className="mt-2 divide-y divide-border text-sm">
                      {d.capacity.staff.map((m) => (
                        <li key={m.name} className="py-2">
                          <div className="flex items-center justify-between gap-3"><span className="truncate font-medium">{m.name}</span><span className="tabular-nums">{formatGHS(m.revenue)}</span></div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${m.share}%` }} /></div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{m.count} bookings, {m.share}% of the work</p>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                )}
              </div>
            </section>
          )}

          {(d.promos.sales.length > 0 || d.promos.coupons.length > 0 || d.promos.giftCards.count > 0) && (
            <section aria-labelledby="promos">
              <h2 id="promos" className="mb-3 text-lg font-semibold">Did your promotions work?</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {d.promos.sales.length > 0 && (
                  <Panel>
                    <h3 className="font-medium">Sales</h3>
                    <p className="text-xs text-muted-foreground">Shop takings per sale day, against the same weekdays before it.</p>
                    <ul className="mt-2 divide-y divide-border text-sm">
                      {d.promos.sales.map((s) => (
                        <li key={s.name} className="flex items-center justify-between gap-3 py-2">
                          <span className="min-w-0"><span className="block truncate font-medium">{s.name} ({s.percentOff}% off)</span><span className="text-xs text-muted-foreground">{formatGHS(s.perSaleDay)} a day, usually {formatGHS(s.usualPerDay)}</span></span>
                          <span className={cn("shrink-0 font-medium tabular-nums", (s.uplift ?? 0) >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400")}>{s.uplift === null ? "-" : `${s.uplift >= 0 ? "+" : ""}${s.uplift}%`}</span>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                )}
                {d.promos.coupons.length > 0 && (
                  <Panel>
                    <h3 className="font-medium">Coupons (last 90 days)</h3>
                    <p className="text-xs text-muted-foreground">Average order {formatGHS(d.promos.shopAvgOrder)} overall. A coupon is worth it when its orders are bigger than that.</p>
                    <ul className="mt-2 divide-y divide-border text-sm">
                      {d.promos.coupons.map((c) => (
                        <li key={c.code} className="flex items-center justify-between gap-3 py-2">
                          <span className="min-w-0"><span className="block font-medium">{c.code}</span><span className="text-xs text-muted-foreground">Used {c.uses} {c.uses === 1 ? "time" : "times"}, {formatGHS(c.discount)} given away</span></span>
                          <span className="shrink-0 tabular-nums">{formatGHS(c.avgOrder)} per order</span>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                )}
                {d.promos.giftCards.count > 0 && (
                  <Panel>
                    <h3 className="font-medium">Gift cards you still owe</h3>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{formatGHS(d.promos.giftCards.outstanding)}</p>
                    <p className="text-sm text-muted-foreground">across {d.promos.giftCards.count} {d.promos.giftCards.count === 1 ? "card" : "cards"}. This is paid for already, so it isn't new money when it's spent.</p>
                  </Panel>
                )}
              </div>
            </section>
          )}

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
