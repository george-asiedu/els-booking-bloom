import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Calendar, 
  Gift, 
  Star, 
  Share2, 
  Clock, 
  User,
  ChevronRight,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const Account = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["my-appointments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, services(name, price, duration)")
        .eq("user_id", user!.id)
        .order("appointment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: loyaltyData } = useQuery({
    queryKey: ["loyalty-points", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: referralCode } = useQuery({
    queryKey: ["referral-code", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: loyaltyTransactions = [] } = useQuery({
    queryKey: ["loyalty-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.appointment_date) >= new Date() && apt.status !== "cancelled"
  );
  const pastAppointments = appointments.filter(
    (apt) => new Date(apt.appointment_date) < new Date() || apt.status === "cancelled"
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const copyReferralLink = () => {
    if (referralCode) {
      navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${referralCode.code}`);
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <Layout>
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-foreground">
                  {profileLoading ? <Skeleton className="h-8 w-40" /> : profile?.full_name || "My Account"}
                </h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Loyalty Points
                </CardTitle>
                <Gift className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {loyaltyData?.points || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {loyaltyData?.lifetime_points || 0} lifetime points
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Upcoming Appointments
                </CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {upcomingAppointments.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {appointments.length} total bookings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Referral Code
                </CardTitle>
                <Share2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-primary font-mono">
                    {referralCode?.code || "—"}
                  </span>
                  <Button size="sm" variant="outline" onClick={copyReferralLink}>
                    Copy Link
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {referralCode?.uses || 0} friends referred
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="appointments" className="space-y-6">
            <TabsList>
              <TabsTrigger value="appointments">
                <Calendar className="h-4 w-4 mr-2" />
                Appointments
              </TabsTrigger>
              <TabsTrigger value="rewards">
                <Gift className="h-4 w-4 mr-2" />
                Rewards
              </TabsTrigger>
            </TabsList>

            <TabsContent value="appointments" className="space-y-6">
              {/* Upcoming Appointments */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Upcoming Appointments</h2>
                {appointmentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : upcomingAppointments.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                      <Button asChild>
                        <Link to="/book">Book Now</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((apt) => (
                      <Card key={apt.id}>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">
                                  {(apt.services as any)?.name || "Service"}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{format(new Date(apt.appointment_date), "MMM d, yyyy")}</span>
                                  <span>•</span>
                                  <span>{apt.appointment_time}</span>
                                </div>
                              </div>
                            </div>
                            <Badge className={statusColors[apt.status]}>
                              {apt.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Appointments */}
              {pastAppointments.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Past Appointments</h2>
                  <div className="space-y-4">
                    {pastAppointments.slice(0, 5).map((apt) => (
                      <Card key={apt.id} className="opacity-75">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                <Clock className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">
                                  {(apt.services as any)?.name || "Service"}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{format(new Date(apt.appointment_date), "MMM d, yyyy")}</span>
                                  <span>•</span>
                                  <span>{apt.appointment_time}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={statusColors[apt.status]}>
                                {apt.status}
                              </Badge>
                              {apt.status === "completed" && (
                                <Button variant="ghost" size="sm" asChild>
                                  <Link to={`/review?service=${(apt.services as any)?.id}`}>
                                    <Star className="h-4 w-4 mr-1" />
                                    Review
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="rewards" className="space-y-6">
              {/* Points Info */}
              <Card className="bg-gradient-to-r from-primary/10 to-accent">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">Your Points Balance</h3>
                      <div className="text-4xl font-bold text-primary">
                        {loyaltyData?.points || 0} pts
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Earn 10 points per $1 spent • 1000 pts = $10 off
                      </p>
                    </div>
                    <Gift className="h-16 w-16 text-primary/20" />
                  </div>
                </CardContent>
              </Card>

              {/* Referral Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-primary" />
                    Refer a Friend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Share your referral code and earn 500 bonus points when your friend books their first appointment!
                  </p>
                  <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                    <span className="text-lg font-mono font-bold text-primary flex-1">
                      {referralCode?.code || "Loading..."}
                    </span>
                    <Button onClick={copyReferralLink}>Copy Link</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              {loyaltyTransactions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Points History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loyaltyTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div>
                            <p className="font-medium text-foreground">{tx.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(tx.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                          <span className={`font-bold ${tx.points > 0 ? "text-green-600" : "text-red-600"}`}>
                            {tx.points > 0 ? "+" : ""}{tx.points} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default Account;
