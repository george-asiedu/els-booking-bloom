import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted))", "#10b981", "#f59e0b"];

const AdminAnalytics = () => {
  // Fetch appointments for analytics
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["admin-analytics-appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, services(name, price, category)")
        .order("appointment_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch services for popular services chart
  const { data: services = [] } = useQuery({
    queryKey: ["admin-analytics-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, category, price");

      if (error) throw error;
      return data;
    },
  });

  // Fetch reviews stats
  const { data: reviewStats } = useQuery({
    queryKey: ["admin-analytics-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("rating, approved");

      if (error) throw error;
      
      const approved = data.filter(r => r.approved);
      const avgRating = approved.length > 0 
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

  // Calculate statistics
  const completedAppointments = appointments.filter(a => a.status === "completed");
  const totalRevenue = completedAppointments.reduce((sum, a) => {
    return sum + (a.services?.price || 0);
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
      serviceBookings[serviceName].revenue += apt.services?.price || 0;
    }
  });

  const popularServices = Object.values(serviceBookings)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Daily bookings for last 7 days
  const dailyBookings = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, "yyyy-MM-dd");
    const count = appointments.filter(a => a.appointment_date === dateStr).length;
    dailyBookings.push({
      day: format(date, "EEE"),
      bookings: count,
    });
  }

  // Category breakdown
  const categoryBreakdown: Record<string, number> = { nails: 0, lashes: 0 };
  appointments.forEach(apt => {
    const category = apt.services?.category || "other";
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
  });

  const categoryData = Object.entries(categoryBreakdown).map(([name, value]) => ({
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                ${totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From {completedAppointments.length} completed appointments
              </p>
            </CardContent>
          </Card>

          <Card>
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
                {last30DaysAppointments.length} in last 30 days
              </p>
            </CardContent>
          </Card>

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
          {/* Daily Bookings Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Bookings This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyBookings}>
                    <XAxis dataKey="day" />
                    <YAxis allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
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
                      {service.count} bookings • ${service.revenue.toLocaleString()} revenue
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
