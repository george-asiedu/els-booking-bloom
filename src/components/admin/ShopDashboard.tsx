import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { ExternalLink, Loader2, PackageCheck, PackageX } from "lucide-react";
import { OnboardingBanner } from "@/components/admin/OnboardingBanner";
import { YourMoneyCard } from "@/components/admin/YourMoneyCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudio } from "@/hooks/useStudio";
import { studioUrl } from "@/config/platform";
import { formatGHS } from "@/lib/currency";
import { ordersApi, productsApi, type OrderDTO } from "@/lib/api";

const SOLD = (o: OrderDTO) => o.status === "paid" || o.status === "fulfilled";
const STATUS_LABEL: Record<OrderDTO["status"], string> = {
  pending_payment: "Awaiting Payment",
  paid: "To Fulfil",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

const Stat = ({ label, value, sub, to }: { label: string; value: string; sub?: string; to?: string }) => {
  const body = (
    <Card className="h-full transition-colors hover:border-primary/40">
      <CardContent className="space-y-1.5 p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
  return to ? <Link to={to} className="block rounded-lg">{body}</Link> : body;
};

/** The dashboard for a Zuri Storefront: orders, sales and stock, no bookings. */
export const ShopDashboard = () => {
  const { name, config } = useStudio();
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
  const sales = thisMonth.reduce((n, o) => n + o.total, 0);
  const salesBefore = lastMonth.reduce((n, o) => n + o.total, 0);
  const toFulfil = all.filter((o) => o.status === "paid");
  const live = (products.data ?? []).filter((p) => p.active);
  const outOfStock = live.filter((p) => p.track_stock && p.stock <= 0);
  const lowStock = live.filter((p) => p.track_stock && p.stock > 0 && p.stock <= 3);
  const recent = [...all].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8);

  // Best sellers this month, by units.
  const units = new Map<string, { name: string; qty: number; value: number }>();
  for (const o of thisMonth)
    for (const i of o.items) {
      const k = i.name;
      const u = units.get(k) ?? { name: k, qty: 0, value: 0 };
      u.qty += i.quantity;
      u.value += i.line_total;
      units.set(k, u);
    }
  const top = [...units.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  const siteUrl = config?.slug ? studioUrl(config.slug) : null;

  return (
    <div className="space-y-6">
      <OnboardingBanner />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your shop</h1>
          <p className="text-muted-foreground">{format(now, "EEEE d MMMM")} · here's how {name} is doing.</p>
        </div>
        {siteUrl && (
          <Button variant="outline" asChild>
            <a href={siteUrl} target="_blank" rel="noopener noreferrer">
              View your shop <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
            </a>
          </Button>
        )}
      </div>

      {orders.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Sales this month" value={formatGHS(sales)} sub={`Same days last month: ${formatGHS(salesBefore)}`} />
            <Stat label="Orders this month" value={String(thisMonth.length)} sub={`Last month so far: ${lastMonth.length}`} to="/admin/orders" />
            <Stat label="To fulfil" value={String(toFulfil.length)} sub="Paid orders waiting to go out" to="/admin/orders" />
            <Stat label="Products live" value={String(live.length)} sub={`${outOfStock.length} out of stock`} to="/admin/products" />
          </div>

          {(toFulfil.length > 0 || outOfStock.length > 0 || lowStock.length > 0) && (
            <Card>
              <CardContent className="flex flex-wrap gap-2 p-4">
                {toFulfil.length > 0 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/admin/orders"><PackageCheck className="mr-2 h-4 w-4" />{toFulfil.length} to fulfil</Link>
                  </Button>
                )}
                {outOfStock.length > 0 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/admin/products"><PackageX className="mr-2 h-4 w-4" />{outOfStock.length} out of stock</Link>
                  </Button>
                )}
                {lowStock.length > 0 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/admin/products">{lowStock.length} running low</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recent orders</CardTitle>
                <Link to="/admin/orders" className="text-sm text-primary hover:underline">All orders</Link>
              </CardHeader>
              <CardContent className="p-0">
                {recent.length === 0 ? (
                  <p className="px-6 pb-6 text-sm text-muted-foreground">No orders yet. Share your shop link to get your first one.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {recent.map((o) => (
                      <li key={o.id} className="flex items-center justify-between gap-3 px-6 py-3 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{o.customer_name ?? "Guest"} · #{o.order_number}</p>
                          <p className="text-xs text-muted-foreground">{format(parseISO(o.created_at), "d MMM, HH:mm")} · {o.fulfillment === "delivery" ? "Delivery" : "Pickup"}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <Badge variant="outline" className="whitespace-nowrap">{STATUS_LABEL[o.status]}</Badge>
                          <span className="tabular-nums font-medium">{formatGHS(o.total)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <div className="space-y-6">
              <YourMoneyCard />
              <Card>
                <CardHeader><CardTitle className="text-base">Best sellers this month</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {top.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nothing sold yet this month.</p>
                  ) : (
                    top.map((t) => (
                      <div key={t.name} className="flex justify-between gap-3 text-sm">
                        <span className="truncate">{t.name}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">{t.qty} sold</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
