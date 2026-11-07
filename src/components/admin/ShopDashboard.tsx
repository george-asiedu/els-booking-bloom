import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { eachDayOfInterval, format, parseISO, startOfDay, startOfMonth, subDays, subMonths } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ExternalLink, ImageOff, Loader2, Package, ShoppingBag, Users, Wallet } from "lucide-react";
import { OnboardingBanner } from "@/components/admin/OnboardingBanner";
import { YourMoneyCard } from "@/components/admin/YourMoneyCard";
import { Change, DashboardHeading, KpiTile, Panel } from "@/components/dashboard/KpiTile";
import { Button } from "@/components/ui/button";
import { useStudio } from "@/hooks/useStudio";
import { studioUrl } from "@/config/platform";
import { formatGHS } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { ordersApi, productsApi, type OrderDTO } from "@/lib/api";

const SOLD = (o: OrderDTO) => o.status === "paid" || o.status === "fulfilled";
const STATUS: Record<OrderDTO["status"], { label: string; className: string }> = {
  pending_payment: { label: "Awaiting Payment", className: "bg-muted text-muted-foreground" },
  paid: { label: "To Fulfil", className: "bg-[hsl(var(--tile-amber))] text-amber-800 dark:text-amber-300" },
  fulfilled: { label: "Fulfilled", className: "bg-[hsl(var(--tile-green))] text-green-800 dark:text-green-300" },
  cancelled: { label: "Cancelled", className: "bg-[hsl(var(--tile-rose))] text-red-800 dark:text-red-300" },
};
const TABS = [
  { id: "all", label: "All orders" },
  { id: "paid", label: "To fulfil" },
  { id: "fulfilled", label: "Fulfilled" },
  { id: "cancelled", label: "Cancelled" },
] as const;
const compact = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(Math.round(v)));

/** The dashboard for a Zuri Storefront: sales, orders, stock and customers. */
export const ShopDashboard = () => {
  const { name, config } = useStudio();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const orders = useQuery({ queryKey: ["dashboard-orders"], queryFn: () => ordersApi.listAll() });
  const products = useQuery({ queryKey: ["dashboard-products"], queryFn: () => productsApi.listAll() });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const prevStart = startOfMonth(subMonths(now, 1));
  const prevEnd = subMonths(now, 1);
  const all = orders.data ?? [];
  const sold = all.filter(SOLD);
  const when = (o: OrderDTO) => parseISO(o.paid_at ?? o.created_at);
  const thisMonth = sold.filter((o) => when(o) >= monthStart);
  const lastMonth = sold.filter((o) => when(o) >= prevStart && when(o) <= prevEnd);
  const sum = (xs: OrderDTO[]) => xs.reduce((n, o) => n + o.total, 0);
  const sales = sum(thisMonth);
  const salesBefore = sum(lastMonth);
  const avg = thisMonth.length ? sales / thisMonth.length : 0;
  const avgBefore = lastMonth.length ? salesBefore / lastMonth.length : 0;
  const toFulfil = all.filter((o) => o.status === "paid");
  const live = (products.data ?? []).filter((p) => p.active);
  const outOfStock = live.filter((p) => p.track_stock && p.stock <= 0);
  const lowStock = live.filter((p) => p.track_stock && p.stock > 0 && p.stock <= 3);

  // Sales for each of the last 30 days.
  const days = eachDayOfInterval({ start: startOfDay(subDays(now, 29)), end: startOfDay(now) }).map((d) => {
    const key = format(d, "yyyy-MM-dd");
    const dayOrders = sold.filter((o) => format(when(o), "yyyy-MM-dd") === key);
    return { day: format(d, "d MMM"), sales: Math.round(sum(dayOrders) * 100) / 100, orders: dayOrders.length };
  });

  // Best sellers this month, by units, with their photos.
  const units = new Map<string, { name: string; qty: number; value: number }>();
  for (const o of thisMonth)
    for (const i of o.items) {
      const u = units.get(i.name) ?? { name: i.name, qty: 0, value: 0 };
      u.qty += i.quantity;
      u.value += i.line_total;
      units.set(i.name, u);
    }
  const photoOf = (n: string) => live.find((p) => p.name === n)?.image_url ?? null;
  const top = [...units.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Customers who spent the most this month.
  const buyers = new Map<string, { name: string; orders: number; spent: number }>();
  for (const o of thisMonth) {
    const key = o.customer_email ?? o.customer_name ?? "Guest";
    const b = buyers.get(key) ?? { name: o.customer_name ?? o.customer_email ?? "Guest", orders: 0, spent: 0 };
    b.orders += 1;
    b.spent += o.total;
    buyers.set(key, b);
  }
  const topBuyers = [...buyers.values()].sort((a, b) => b.spent - a.spent).slice(0, 4);

  const recent = [...all]
    .filter((o) => tab === "all" || o.status === tab)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 8);
  const siteUrl = config?.slug ? studioUrl(config.slug) : null;

  return (
    <div className="mx-auto max-w-7xl">
      <OnboardingBanner />
      <DashboardHeading
        title="Welcome back"
        subtitle={`${format(now, "EEEE d MMMM")} · here's what's happening at ${name}.`}
        actions={
          siteUrl && (
            <Button variant="outline" asChild>
              <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                View your store <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
              </a>
            </Button>
          )
        }
      />

      {orders.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile tone="amber" label="Sales this month" value={formatGHS(sales)} icon={<Wallet className="h-5 w-5" />} change={<Change now={sales} before={salesBefore} />} hint="vs same days last month" to="/admin/transactions" />
            <KpiTile tone="green" label="Orders this month" value={String(thisMonth.length)} icon={<ShoppingBag className="h-5 w-5" />} change={<Change now={thisMonth.length} before={lastMonth.length} />} hint={`${toFulfil.length} to fulfil`} to="/admin/orders" />
            <KpiTile tone="blue" label="Average order value" value={formatGHS(avg)} icon={<Package className="h-5 w-5" />} change={<Change now={avg} before={avgBefore} />} hint="per paid order" />
            <KpiTile tone="rose" label="Products live" value={String(live.length)} icon={<Users className="h-5 w-5" />} hint={outOfStock.length || lowStock.length ? `${outOfStock.length} out of stock · ${lowStock.length} running low` : "All in stock"} to="/admin/products" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Panel title="Sales, last 30 days" className="min-w-0 lg:col-span-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={days} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} interval={6} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={compact} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                      formatter={(v: number, k) => (k === "sales" ? [formatGHS(v), "Sales"] : [v, "Orders"])}
                    />
                    <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title="Best sellers this month" action={<Link to="/admin/products" className="text-sm text-primary hover:underline">Products</Link>}>
              {top.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing sold yet this month.</p>
              ) : (
                <ul className="space-y-3">
                  {top.map((t) => {
                    const img = photoOf(t.name);
                    return (
                      <li key={t.name} className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                          {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <ImageOff className="h-4 w-4 text-muted-foreground" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{formatGHS(t.value)}</p>
                        </div>
                        <span className="shrink-0 rounded-md border border-border px-2 py-1 text-xs tabular-nums">{t.qty} sold</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Panel
              className="min-w-0 lg:col-span-2"
              title="Recent orders"
              action={<Link to="/admin/orders" className="text-sm text-primary hover:underline">View all</Link>}
            >
              <div className="mb-3 flex gap-1 overflow-x-auto rounded-lg bg-muted p-1 text-sm [scrollbar-width:none]" role="tablist">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                    className={cn("shrink-0 rounded-md px-3 py-1.5", tab === t.id ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {recent.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No orders here yet. Share your store link to get your first one.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[34rem] text-sm">
                    <thead className="text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="pb-2 font-medium">Product</th>
                        <th className="pb-2 font-medium">Customer</th>
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recent.map((o) => {
                        const first = o.items[0];
                        const img = first ? photoOf(first.name) : null;
                        return (
                          <tr key={o.id}>
                            <td className="py-3">
                              <span className="flex items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                                  {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <ImageOff className="h-4 w-4 text-muted-foreground" />}
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate font-medium">{first?.name ?? "Order"}</span>
                                  {o.items.length > 1 && <span className="text-xs text-muted-foreground">+{o.items.length - 1} more</span>}
                                </span>
                              </span>
                            </td>
                            <td className="py-3">{o.customer_name ?? "Guest"}</td>
                            <td className="py-3 text-muted-foreground">{format(parseISO(o.created_at), "d MMM yyyy")}</td>
                            <td className="py-3">
                              <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium", STATUS[o.status].className)}>{STATUS[o.status].label}</span>
                            </td>
                            <td className="py-3 text-right font-medium tabular-nums">{formatGHS(o.total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
            <div className="space-y-6">
              <Panel title="Top customers this month">
                {topBuyers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Your best customers will show here.</p>
                ) : (
                  <ul className="space-y-3">
                    {topBuyers.map((b) => (
                      <li key={b.name} className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold">{b.name.charAt(0).toUpperCase()}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.orders} {b.orders === 1 ? "order" : "orders"}</p>
                        </div>
                        <span className="text-sm font-medium tabular-nums">{formatGHS(b.spent)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
              <YourMoneyCard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
