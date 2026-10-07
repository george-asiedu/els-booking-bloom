import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Calendar, DollarSign, Star, TrendingUp, Users } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { appointmentsApi, categoriesApi, reviewsApi, type AppointmentDTO } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { formatGHS } from "@/lib/currency";
import {
  bucketFor,
  bucketSlots,
  inRange,
  previousPeriod,
  rangeFromParams,
  rangeToParams,
  resolveRange,
  type DateRangeValue,
} from "@/lib/dateRange";

// Distinct, high-contrast slice colors, assigned to categories in a fixed order.
const COLORS = ["#d6336c", "#7048e8", "#f59e0b", "#10b981", "#0ea5e9"];

type StatusFilter = "all" | "pending" | "confirmed" | "completed" | "cancelled";
// Which date places a booking in the range: when it was made, or when the
// appointment happens (which includes upcoming ones).
type Basis = "booked" | "appointment";

const DEFAULT_RANGE: DateRangeValue = { preset: "30d" };

// appointment_date is a calendar day ("yyyy-MM-dd"): parse it as local
// midnight, not UTC, or it can land on the previous day.
const appointmentDay = (a: AppointmentDTO) => new Date(`${a.appointment_date}T00:00:00`);
const dateOf = (a: AppointmentDTO, basis: Basis) =>
  basis === "booked" ? new Date(a.created_at) : appointmentDay(a);

/** "+3 (+50%) vs previous 30 days", or null when there's nothing to compare. */
const changeText = (now: number, before: number, days: number, money = false) => {
  if (now === 0 && before === 0) return null;
  const diff = now - before;
  const amount = money ? formatGHS(Math.abs(diff)) : String(Math.abs(diff));
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "±";
  const pct = before > 0 ? ` (${sign}${Math.round((Math.abs(diff) / before) * 100)}%)` : "";
  return `${sign}${amount}${pct} vs previous ${days} days`;
};

const AdminAnalytics = () => {
  const [params, setParams] = useSearchParams();
  const range = rangeFromParams(params, DEFAULT_RANGE);
  const basis: Basis = params.get("by") === "appointment" ? "appointment" : "booked";
  const status = (params.get("status") as StatusFilter | null) ?? "all";

  // Filters live in the URL, so a refresh or a shared link keeps the view.
  const update = (next: { range?: DateRangeValue; basis?: Basis; status?: StatusFilter }) => {
    const r = next.range ?? range;
    const b = next.basis ?? basis;
    const s = next.status ?? status;
    setParams(
      {
        ...rangeToParams(r),
        ...(b !== "booked" ? { by: b } : {}),
        ...(s !== "all" ? { status: s } : {}),
      },
      { replace: true },
    );
  };

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["admin-analytics-appointments"],
    queryFn: () => appointmentsApi.listAllForAnalytics(),
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ["admin-analytics-reviews"],
    queryFn: () => reviewsApi.listAll(),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => categoriesApi.listAll(),
  });

  const view = useMemo(() => {
    const earliest = appointments.reduce<Date | null>((min, a) => {
      const d = dateOf(a, basis);
      return !min || d < min ? d : min;
    }, null);
    const resolved = resolveRange(range, earliest);
    const prev = previousPeriod(resolved);
    const compare = range.preset !== "all";

    const inPeriod = (from: Date, to: Date) =>
      appointments.filter((a) => inRange(dateOf(a, basis), from, to));
    const current = inPeriod(resolved.from, resolved.to);
    const before = compare ? inPeriod(prev.from, prev.to) : [];

    const byStatus = (list: AppointmentDTO[]) =>
      status === "all" ? list : list.filter((a) => a.status === status);
    const bookings = byStatus(current);
    const bookingsBefore = byStatus(before);

    const revenueOf = (list: AppointmentDTO[]) =>
      list.filter((a) => a.status === "completed").reduce((sum, a) => sum + (a.amount_due || 0), 0);
    const completed = current.filter((a) => a.status === "completed");

    // Chart bars: days, weeks or months depending on the range length.
    const bucket = bucketFor(resolved);
    const slots = bucketSlots(resolved, bucket);
    const chart = slots.map((slot) => ({
      axis: slot.axis,
      full: slot.full,
      bookings: bookings.filter((a) => inRange(dateOf(a, basis), slot.start, slot.end)).length,
    }));

    const reviewsInRange = reviews.filter((r) =>
      inRange(new Date(r.created_at), resolved.from, resolved.to),
    );
    const approvedReviews = reviewsInRange.filter((r) => r.approved);

    const nameOf = new Map(categories.map((c) => [c.slug, c.name]));
    const perCategory = new Map<string, number>();
    const perService = new Map<string, { name: string; count: number; revenue: number }>();
    for (const a of bookings) {
      const cat = a.services?.category || "other";
      perCategory.set(cat, (perCategory.get(cat) ?? 0) + 1);
      const name = a.services?.name || "Unknown";
      const s = perService.get(name) ?? { name, count: 0, revenue: 0 };
      s.count++;
      if (a.status === "completed") s.revenue += a.amount_due || 0;
      perService.set(name, s);
    }

    return {
      resolved,
      compareDays: compare ? prev.days : null,
      bucket,
      chart,
      bookings,
      bookingsBefore,
      completed,
      revenue: revenueOf(current),
      revenueBefore: revenueOf(before),
      cancelled: current.filter((a) => a.status === "cancelled").length,
      completionRate: current.length ? Math.round((completed.length / current.length) * 100) : null,
      avgRating: approvedReviews.length
        ? (approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length).toFixed(1)
        : null,
      reviewsApproved: approvedReviews.length,
      reviewsPending: reviewsInRange.length - approvedReviews.length,
      categoryData: [...perCategory.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([slug, value]) => ({ name: nameOf.get(slug) ?? slug, value })),
      popularServices: [...perService.values()].sort((a, b) => b.count - a.count).slice(0, 5),
    };
  }, [appointments, reviews, categories, range.preset, range.from, range.to, basis, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const chartConfig = { bookings: { label: "Bookings", color: "hsl(var(--primary))" } };
  const bucketWord = view.bucket === "day" ? "day" : view.bucket;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">How bookings, revenue and reviews are going.</p>
        </div>

        {/* One filter row; everything below follows it. */}
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter value={range} resolved={view.resolved} onChange={(r) => update({ range: r })} />
          <ToggleGroup
            type="single"
            value={basis}
            onValueChange={(v) => v && update({ basis: v as Basis })}
            className="rounded-md border p-0.5"
            aria-label="Count bookings by"
          >
            <ToggleGroupItem value="booked" className="h-8 px-3 text-sm">
              Date booked
            </ToggleGroupItem>
            <ToggleGroupItem value="appointment" className="h-8 px-3 text-sm">
              Appointment date
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={status} onValueChange={(v) => update({ status: v as StatusFilter })}>
            <SelectTrigger className="h-9 w-[150px]" aria-label="Booking status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="-mt-3 text-xs text-muted-foreground">
          {basis === "booked"
            ? "Counting bookings by the day they were made."
            : "Counting bookings by the day of the appointment, including upcoming ones."}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer transition-colors hover:border-primary/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold tabular-nums text-foreground">
                        {formatGHS(view.revenue)}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {view.compareDays !== null &&
                          changeText(view.revenue, view.revenueBefore, view.compareDays, true)}
                        {view.compareDays === null &&
                          `From ${view.completed.length} completed appointments`}
                      </p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Completed appointments, {view.resolved.span}</DialogTitle>
                  </DialogHeader>
                  <div className="-mx-2 max-h-[60vh] overflow-y-auto px-2">
                    {view.completed.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        No completed appointments in this range.
                      </p>
                    ) : (
                      <div className="divide-y divide-border">
                        {view.completed.map((a) => (
                          <div key={a.id} className="flex items-center justify-between py-3">
                            <div>
                              <p className="font-medium text-foreground">{a.services?.name || "Service"}</p>
                              <p className="text-xs text-muted-foreground">
                                {a.full_name} • {a.appointment_date}
                              </p>
                            </div>
                            <span className="font-semibold tabular-nums text-foreground">
                              {formatGHS(a.amount_due)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3 font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums text-primary">{formatGHS(view.revenue)}</span>
                  </div>
                </DialogContent>
              </Dialog>

              <Link to="/admin" className="block">
                <Card className="h-full cursor-pointer transition-colors hover:border-primary/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Bookings</CardTitle>
                    <Calendar className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold tabular-nums text-foreground">{view.bookings.length}</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(view.compareDays !== null &&
                        changeText(view.bookings.length, view.bookingsBefore.length, view.compareDays)) ||
                        "View all appointments"}
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average rating</CardTitle>
                  <Star className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tabular-nums text-foreground">{view.avgRating ?? "—"}</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {view.reviewsApproved} reviews in range ({view.reviewsPending} awaiting approval)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completion rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tabular-nums text-foreground">
                    {view.completionRate === null ? "—" : `${view.completionRate}%`}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {view.cancelled} cancelled in range
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Bookings per {bucketWord}
                    </CardTitle>
                    <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                      {view.bookings.length} total
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{view.resolved.span}</p>
                </CardHeader>
                <CardContent>
                  {view.bookings.length === 0 ? (
                    <div className="flex h-[300px] flex-col items-center justify-center text-center text-muted-foreground">
                      <BarChart3 className="mb-3 h-10 w-10 opacity-40" />
                      <p>No bookings in this range.</p>
                      <p className="text-sm">Try a longer range, another status, or count by appointment date.</p>
                    </div>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={view.chart} margin={{ left: -16 }}>
                          <XAxis
                            dataKey="axis"
                            interval="preserveStartEnd"
                            minTickGap={16}
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                          <ChartTooltip
                            cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                            content={
                              <ChartTooltipContent
                                labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ""}
                              />
                            }
                          />
                          <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Bookings by category
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{view.resolved.span}</p>
                </CardHeader>
                <CardContent>
                  {view.categoryData.length === 0 ? (
                    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                      No bookings in this range.
                    </div>
                  ) : (
                    <div className="flex h-[300px] items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={view.categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {view.categoryData.map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Most popular services</CardTitle>
                <p className="text-sm text-muted-foreground">{view.resolved.span}</p>
              </CardHeader>
              <CardContent>
                {view.popularServices.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No bookings in this range.</p>
                ) : (
                  <div className="space-y-4">
                    {view.popularServices.map((service, index) => (
                      <div key={service.name} className="flex items-center gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{service.name}</p>
                          <p className="text-sm tabular-nums text-muted-foreground">
                            {service.count} bookings • {formatGHS(service.revenue)} revenue
                          </p>
                        </div>
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${(service.count / (view.popularServices[0]?.count || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
