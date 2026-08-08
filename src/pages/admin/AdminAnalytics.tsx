import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Star
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { appointmentsApi, servicesApi, reviewsApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

// Distinct, high-contrast slice colors (nails / lashes / hair are all visible).
const COLORS = ["#d6336c", "#7048e8", "#f59e0b", "#10b981", "#0ea5e9"];

type StatusFilter = "all" | "pending" | "confirmed" | "completed" | "cancelled";

const AdminAnalytics = () => {
  // Filters for the bookings-over-time chart.
  const [rangeDays, setRangeDays] = useState<number>(7);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Fetch appointments for analytics
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["admin-analytics-appointments"],
    queryFn: () => appointmentsApi.listAll(),
  });

  // Fetch services for popular services chart
  const { data: services = [] } = useQuery({
    queryKey: ["admin-analytics-services"],
    queryFn: () => servicesApi.listAll(),
  });

  // Fetch reviews stats
  const { data: reviewStats } = useQuery({
    queryKey: ["admin-analytics-reviews"],
    queryFn: async () => {
      const data = await reviewsApi.listAll();
      const approved = data.filter((r) => r.approved);
      const avgRating =
        approved.length > 0
          ? approved.reduce((sum, r) => sum + r.rating, 0) / approved.length
          : 0;

      return {
        total: data.length,
        approved: approved.length,
        pending: data.length - approved.length,
        avgRating: avgRating.toFixed(1),
      };
    },
  });

  // Calculate statistics — revenue is the amount actually charged (after promo
  // and any loyalty discount).
  const completedAppointments = appointments.filter(a => a.status === "completed");
  const totalRevenue = completedAppointments.reduce((sum, a) => {
    return sum + (a.amount_due || 0);
  }, 0);

  const last30DaysAppointments = appointments.filter(a => {
    const date = new Date(a.appointment_date);
    return date >= subDays(new Date(), 30);
  });

  // Service popularity
  const serviceBookings: Record<string, { name: string; count: number; revenue: number }> = {};
  appointments.forEach(apt => {
    const serviceName = apt.services?.name || "Unknown";
    if (!serviceBookings[serviceName]) {
      serviceBookings[serviceName] = { name: serviceName, count: 0, revenue: 0 };
    }
    serviceBookings[serviceName].count++;
    if (apt.status === "completed") {
      serviceBookings[serviceName].revenue += apt.amount_due || 0;
    }
  });

  const popularServices = Object.values(serviceBookings)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Bookings over the selected range, counted by the date each booking was made
  // (created_at) so recently-made bookings show even if scheduled for the future.
  const chartAppointments =
    statusFilter === "all"
      ? appointments
      : appointments.filter((a) => a.status === statusFilter);

  const dailyBookings = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, "yyyy-MM-dd");
    const count = chartAppointments.filter(
      (a) => format(new Date(a.created_at), "yyyy-MM-dd") === dateStr,
    ).length;
    dailyBookings.push({
      day: rangeDays <= 7 ? format(date, "EEE") : format(date, "MMM d"),
      bookings: count,
    });
  }
  const totalInRange = dailyBookings.reduce((s, d) => s + d.bookings, 0);

  // Category breakdown
  const categoryBreakdown: Record<string, number> = { nails: 0, lashes: 0, hair: 0 };
  appointments.forEach(apt => {
    const category = apt.services?.category || "other";
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
  });

  const categoryData = Object.entries(categoryBreakdown)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

  const chartConfig = {
    bookings: {
      label: "Bookings",
      color: "hsl(var(--primary))",
    },
  };

  if (appointmentsLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-serif font-bold text-foreground">Analytics</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Business insights and performance metrics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Dialog>
            <DialogTrigger asChild>
              <Card className="cursor-pointer transition-colors hover:border-primary/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    GHS {totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    From {completedAppointments.length} completed appointments — tap to view
                  </p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Completed revenue</DialogTitle>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto -mx-2 px-2">
                {completedAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No completed appointments yet.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {completedAppointments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {a.services?.name || "Service"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {a.full_name} • {a.appointment_date}
                          </p>
                        </div>
                        <span className="font-semibold text-foreground">
                          GHS {a.amount_due}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3 font-semibold">
                <span>Total</span>
                <span className="text-primary">GHS {totalRevenue.toLocaleString()}</span>
              </div>
            </DialogContent>
          </Dialog>

          <Link to="/admin" className="block">
            <Card className="cursor-pointer transition-colors hover:border-primary/50 h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Bookings
                </CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {appointments.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {last30DaysAppointments.length} in last 30 days — view all
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Rating
              </CardTitle>
              <Star className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {reviewStats?.avgRating || "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {reviewStats?.approved || 0} reviews ({reviewStats?.pending || 0} pending)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {appointments.length > 0 
                  ? Math.round((completedAppointments.length / appointments.length) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {appointments.filter(a => a.status === "cancelled").length} cancelled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bookings over time */}
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Bookings Over Time
                </CardTitle>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {totalInRange} total
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={String(rangeDays)}
                  onValueChange={(v) => setRangeDays(Number(v))}
                >
                  <SelectTrigger className="w-[150px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="14">Last 14 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                >
                  <SelectTrigger className="w-[150px] h-9">
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
            </CardHeader>
            <CardContent>
              {totalInRange === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-center text-muted-foreground">
                  <BarChart3 className="h-10 w-10 mb-3 opacity-40" />
                  <p>No bookings in this range.</p>
                  <p className="text-sm">Try a longer range or a different status.</p>
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyBookings}>
                      <XAxis
                        dataKey="day"
                        interval={rangeDays > 14 ? 2 : 0}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="bookings" fill="#d6336c" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Service Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Services */}
        <Card>
          <CardHeader>
            <CardTitle>Most Popular Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularServices.map((service, index) => (
                <div key={service.name} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {service.count} bookings • GHS {service.revenue.toLocaleString()} revenue
                    </p>
                  </div>
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(service.count / (popularServices[0]?.count || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
