import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  format,
  formatDistanceToNowStrict,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Loader2,
  PackageCheck,
  PackageX,
  Star,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { OnboardingBanner } from "@/components/admin/OnboardingBanner";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { YourMoneyCard } from "@/components/admin/YourMoneyCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudio } from "@/hooks/useStudio";
import { studioUrl } from "@/config/platform";
import { formatGHS } from "@/lib/currency";
import { cn } from "@/lib/utils";
import {
  appointmentsApi,
  ordersApi,
  productsApi,
  reviewsApi,
  transactionsApi,
  studioMoneyApi,
  type AppointmentDTO,
} from "@/lib/api";

// ---- helpers ---------------------------------------------------------------

const ACTIVE = (a: AppointmentDTO) => a.status !== "cancelled";

/** "14:30", "2:30 PM" and "2:30pm" all become minutes after midnight. */
const minutesOf = (time: string) => {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*([ap]m)?$/i);
  if (!m) return 0;
  let h = Number(m[1]) % 24;
  const ampm = m[3]?.toLowerCase();
  if (ampm === "pm" && h < 12) h += 12;
  if (ampm === "am" && h === 12) h = 0;
  return h * 60 + Number(m[2]);
};

const byWhen = (a: AppointmentDTO, b: AppointmentDTO) =>
  a.appointment_date.localeCompare(b.appointment_date) ||
  minutesOf(a.appointment_time) - minutesOf(b.appointment_time);

const dayLabel = (d: Date, today: Date) => {
  const diff = differenceInCalendarDays(d, today);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return format(d, "EEEE d MMMM");
};

const greeting = (now: Date) => {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

const STATUS: Record<AppointmentDTO["status"], { label: string; className: string }> = {
  pending: { label: "To confirm", className: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300" },
  pending_reschedule: { label: "New time requested", className: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300" },
  confirmed: { label: "Confirmed", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300" },
  completed: { label: "Completed", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground line-through" },
};

/** "+20%" against last month, or a plain note when there's nothing to compare. */
const Change = ({ now, before, money }: { now: number; before: number; money?: boolean }) => {
  const prev = money ? formatGHS(before) : String(before);
  if (before === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {now === 0 ? "Nothing at this point last month" : "None at this point last month"}
      </p>
    );
  }
  const pct = Math.round(((now - before) / before) * 100);
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <p className="text-xs text-muted-foreground">
      <span
        className={cn(
          "mr-1 inline-flex items-center align-middle font-medium",
          up ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400",
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {up ? "+" : ""}
        {pct}%
      </span>
      <span>vs {prev} at this point last month</span>
    </p>
  );
};

const Stat = ({
  label,
  value,
  children,
  to,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
  to?: string;
}) => {
  const body = (
    <Card className={cn("h-full", to && "transition-colors hover:border-primary/40")}>
      <CardContent className="space-y-1.5 p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
        {children}
      </CardContent>
    </Card>
  );
  return to ? (
    <Link to={to} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </Link>
  ) : (
    body
  );
};

// ---- page ------------------------------------------------------------------

const AdminDashboard = () => {
  const { name: studioName, config, features } = useStudio();
  const now = new Date();
  const today = startOfDay(now);
  const monthStart = startOfMonth(now);
  // The same stretch of last month, so a half-finished month isn't compared
  // against a whole one.
  const prevStart = startOfMonth(subMonths(now, 1));
  const prevEnd = subMonths(now, 1);

  // Same query (and cache) as the Analytics page.
  const appointmentsQuery = useQuery({
    queryKey: ["admin-analytics-appointments"],
    queryFn: () => appointmentsApi.listAllForAnalytics(),
  });
  // Same query (and cache) as the Your money card, so the two always agree.
  const money = useQuery({
    queryKey: ["studio-money"],
    queryFn: () => studioMoneyApi.get(),
    staleTime: 60_000,
  });
  const recentPayments = useQuery({
    queryKey: ["dashboard-recent-payments"],
    queryFn: () => transactionsApi.list({ limit: 6 }),
  });
  const ordersQuery = useQuery({
    queryKey: ["dashboard-orders"],
    queryFn: () => ordersApi.listAll(),
    enabled: features.commerce,
  });
  const productsQuery = useQuery({
    queryKey: ["dashboard-products"],
    queryFn: () => productsApi.listAll(),
    enabled: features.commerce,
  });
  const reviewsQuery = useQuery({
    queryKey: ["admin-analytics-reviews"],
    queryFn: () => reviewsApi.listAll(),
    enabled: features.reviews,
  });

  const appointments = appointmentsQuery.data ?? [];
  const active = appointments.filter(ACTIVE);

  // Today
  const todays = active
    .filter((a) => isSameDay(parseISO(a.appointment_date), today))
    .sort(byWhen);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nextToday = todays.find(
    (a) => a.status !== "completed" && minutesOf(a.appointment_time) >= nowMinutes,
  );

  // This month vs the same days last month (by appointment date).
  const inRange = (a: AppointmentDTO, from: Date, to: Date) => {
    const d = parseISO(a.appointment_date);
    return d >= startOfDay(from) && d <= endOfDay(to);
  };
  const bookingsNow = active.filter((a) => inRange(a, monthStart, now)).length;
  const bookingsBefore = active.filter((a) => inRange(a, prevStart, prevEnd)).length;

  // Coming up: the next 7 days, grouped by day.
  const horizon = endOfDay(addDays(today, 6));
  const upcoming = active
    .filter((a) => a.status !== "completed" && inRange(a, today, horizon))
    .sort(byWhen);
  const shown = upcoming.slice(0, 8);
  const groups: { day: Date; items: AppointmentDTO[] }[] = [];
  for (const a of shown) {
    const day = parseISO(a.appointment_date);
    const last = groups[groups.length - 1];
    if (last && isSameDay(last.day, day)) last.items.push(a);
    else groups.push({ day, items: [a] });
  }

  // Waiting on the studio.
  const toConfirm = appointments.filter((a) => a.status === "pending").length;
  const newTimes = appointments.filter((a) => a.status === "pending_reschedule").length;
  const toFulfil = (ordersQuery.data ?? []).filter((o) => o.status === "paid").length;
  const toApprove = (reviewsQuery.data ?? []).filter((r) => !r.approved).length;
  const outOfStock = (productsQuery.data ?? []).filter(
    (p) => p.active && p.track_stock && p.stock <= 0,
  ).length;
  const tasks = [
    { count: toConfirm, label: toConfirm === 1 ? "booking to confirm" : "bookings to confirm", to: "/admin/appointments?status=pending", icon: CalendarCheck },
    { count: newTimes, label: newTimes === 1 ? "new time requested" : "new times requested", to: "/admin/appointments?status=pending_reschedule", icon: CalendarClock },
    ...(features.commerce
      ? [
          { count: toFulfil, label: toFulfil === 1 ? "paid order to fulfil" : "paid orders to fulfil", to: "/admin/orders", icon: PackageCheck },
          { count: outOfStock, label: outOfStock === 1 ? "product out of stock" : "products out of stock", to: "/admin/products", icon: PackageX },
        ]
      : []),
    ...(features.reviews
      ? [{ count: toApprove, label: toApprove === 1 ? "review to approve" : "reviews to approve", to: "/admin/reviews", icon: Star }]
      : []),
  ].filter((t) => t.count > 0);
  const waiting = toConfirm + newTimes + toFulfil;

  // Top services this month (by bookings, then value).
  const services = new Map<string, { name: string; count: number; value: number }>();
  for (const a of active.filter((x) => inRange(x, monthStart, endOfMonth(now)))) {
    const name = a.services?.name ?? "Other";
    const s = services.get(name) ?? { name, count: 0, value: 0 };
    s.count += 1;
    s.value += a.amount_due ?? a.total_price ?? 0;
    services.set(name, s);
  }
  const topServices = [...services.values()]
    .sort((a, b) => b.count - a.count || b.value - a.value)
    .slice(0, 5);
  const topMax = topServices[0]?.count ?? 0;

  const siteUrl = config?.slug ? studioUrl(config.slug) : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <OnboardingBanner />

        {/* Heading */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {greeting(now)}
            </h1>
            <p className="text-muted-foreground">
              {format(now, "EEEE d MMMM")} · here's how {studioName} is doing.
            </p>
          </div>
          {siteUrl && (
            <Button variant="outline" asChild>
              <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                View your site
                <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
              </a>
            </Button>
          )}
        </div>

        {appointmentsQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Headline numbers */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                label="Today"
                value={`${todays.length} ${todays.length === 1 ? "appointment" : "appointments"}`}
                to="/admin/appointments"
              >
                <p className="truncate text-xs text-muted-foreground">
                  {nextToday
                    ? `Next: ${nextToday.appointment_time} · ${nextToday.services?.name ?? "Appointment"}`
                    : todays.length
                      ? "No more appointments today"
                      : "Nothing booked for today"}
                </p>
              </Stat>
              <Stat
                label="Money received this month"
                value={money.data ? formatGHS(money.data.received.thisMonth) : "—"}
                to="/admin/transactions"
              >
                {money.data ? (
                  <Change now={money.data.received.thisMonth} before={money.data.received.lastMonthSoFar} money />
                ) : (
                  <p className="text-xs text-muted-foreground">Payments in, minus refunds</p>
                )}
              </Stat>
              <Stat label="Bookings this month" value={String(bookingsNow)} to="/admin/analytics">
                <Change now={bookingsNow} before={bookingsBefore} />
              </Stat>
              <Stat
                label="Waiting on you"
                value={String(waiting)}
                to={toConfirm ? "/admin/appointments?status=pending" : undefined}
              >
                <p className="text-xs text-muted-foreground">
                  {waiting === 0
                    ? "Nothing to confirm or fulfil"
                    : [
                        toConfirm && `${toConfirm} to confirm`,
                        newTimes && `${newTimes} new ${newTimes === 1 ? "time" : "times"}`,
                        toFulfil && `${toFulfil} ${toFulfil === 1 ? "order" : "orders"} to fulfil`,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                </p>
              </Stat>
            </div>

            {/* Money first: where it stands, then the latest payments. */}
            <YourMoneyCard />

            {/* Recent payments */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Recent payments</CardTitle>
                <Link
                  to="/admin/transactions"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  All transactions <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </CardHeader>
              <CardContent>
                {recentPayments.isLoading ? (
                  <Loader2 className="mx-auto my-6 h-5 w-5 animate-spin text-muted-foreground" />
                ) : (recentPayments.data?.entries.length ?? 0) === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Payments from bookings and orders will show here.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {recentPayments.data!.entries.map((e) => {
                      const out = e.direction === "DEBIT" || e.type === "REFUND";
                      const ok = e.status === "SUCCESS";
                      return (
                        <li key={e.id} className="flex items-center gap-4 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {e.customerName || e.description}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {e.customerName ? `${e.description} · ` : ""}
                              {formatDistanceToNowStrict(parseISO(e.occurredAt), { addSuffix: true })}
                            </p>
                          </div>
                          {!ok && (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {e.status === "PENDING" ? "Pending" : "Didn't go through"}
                            </span>
                          )}
                          <span
                            className={cn(
                              "shrink-0 text-sm font-medium tabular-nums",
                              !ok && "text-muted-foreground line-through",
                              ok && !out && "text-emerald-700 dark:text-emerald-400",
                            )}
                          >
                            {out ? "−" : "+"}
                            {formatGHS(e.amount)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Coming up */}
              <Card className="min-w-0 lg:col-span-2">
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-base">Coming up this week</CardTitle>
                  <Link
                    to="/admin/appointments"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    All appointments <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </CardHeader>
                <CardContent>
                  {groups.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className="font-medium">No appointments in the next 7 days</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Share your booking link on Instagram or WhatsApp to fill your week.
                      </p>
                      {siteUrl && (
                        <Button variant="outline" size="sm" className="mt-4" asChild>
                          <a href={`${siteUrl}/book`} target="_blank" rel="noopener noreferrer">
                            Open your booking page
                          </a>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {groups.map((g) => (
                        <section key={g.day.toISOString()} aria-label={dayLabel(g.day, today)}>
                          <h3 className="mb-2 text-xs font-medium text-muted-foreground">
                            {dayLabel(g.day, today)}
                            {differenceInCalendarDays(g.day, today) > 1 ? "" : ` · ${format(g.day, "d MMM")}`}
                          </h3>
                          <ul className="divide-y rounded-md border">
                            {g.items.map((a) => (
                              <li key={a.id} className="flex items-center gap-4 px-3 py-2.5">
                                <span className="w-[4.5rem] shrink-0 text-sm font-medium tabular-nums">
                                  {a.appointment_time}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">{a.full_name}</p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {a.services?.name ?? "Appointment"}
                                    {a.amount_due ? ` · ${formatGHS(a.amount_due)}` : ""}
                                  </p>
                                </div>
                                <Badge
                                  variant="secondary"
                                  className={cn("shrink-0 font-medium", STATUS[a.status].className)}
                                >
                                  {STATUS[a.status].label}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}
                      {upcoming.length > shown.length && (
                        <p className="text-sm text-muted-foreground">
                          and {upcoming.length - shown.length} more this week.{" "}
                          <Link to="/admin/appointments" className="text-primary hover:underline">
                            See them all
                          </Link>
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="min-w-0 space-y-6">
                {/* Needs attention */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Needs your attention</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tasks.length === 0 ? (
                      <p className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
                        You're all caught up.
                      </p>
                    ) : (
                      <ul className="-mx-2">
                        {tasks.map((t) => (
                          <li key={t.label}>
                            <Link
                              to={t.to}
                              className="flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent/60"
                            >
                              <t.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                              <span className="flex-1">
                                <span className="font-semibold tabular-nums">{t.count}</span> {t.label}
                              </span>
                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                {/* Top services */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Most booked this month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topServices.length === 0 ? (
                      <p className="py-2 text-sm text-muted-foreground">No bookings yet this month.</p>
                    ) : (
                      <ul className="space-y-3">
                        {topServices.map((s) => (
                          <li key={s.name}>
                            <div className="flex items-baseline justify-between gap-3 text-sm">
                              <span className="truncate font-medium">{s.name}</span>
                              <span className="shrink-0 tabular-nums text-muted-foreground">
                                {s.count} · {formatGHS(s.value)}
                              </span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${Math.max(6, (s.count / topMax) * 100)}%` }}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <DashboardCharts appointments={appointments} />

          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
