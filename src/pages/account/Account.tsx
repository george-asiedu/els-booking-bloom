/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
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
  LogOut,
  Loader2,
  CreditCard,
  Receipt,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import {
  profileApi,
  appointmentsApi,
  accountApi,
  paymentsApi,
  AppointmentDTO,
} from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileEditDialog } from "@/components/account/ProfileEditDialog";
import { useToast } from "@/hooks/use-toast";
import { downloadReceipt, receiptFromAppointment } from "@/lib/receipt";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

// Small payment badge for an appointment's payment state.
const PaymentBadge = ({ apt }: { apt: AppointmentDTO }) => {
  const p = apt.payment;
  if (!p || p.status === "pending") {
    return <Badge variant="secondary">Payment pending</Badge>;
  }
  if (p.status === "paid") {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        {p.type === "partial" ? `Deposit paid · GHS ${p.balance} due` : "Paid"}
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      {p.status === "failed" ? "Payment failed" : "Refunded"}
    </Badge>
  );
};

const Account = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payingId, setPayingId] = useState<string | null>(null);

  // Resume/complete a payment for an existing booking.
  const handlePay = async (apt: AppointmentDTO) => {
    if (!apt.payment) return;
    try {
      setPayingId(apt.id);
      const init = await paymentsApi.initialize(
        apt.id,
        apt.payment.type === "partial" ? "PARTIAL" : "FULL",
      );
      window.location.href = init.authorization_url;
    } catch (error) {
      setPayingId(null);
      toast({
        variant: "destructive",
        title: "Couldn't start payment",
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => profileApi.getMine(),
    enabled: !!user,
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["my-appointments", user?.id],
    queryFn: () => appointmentsApi.listMine(),
    enabled: !!user,
  });

  const { data: loyaltyData } = useQuery({
    queryKey: ["loyalty-points", user?.id],
    queryFn: () => accountApi.getLoyalty(),
    enabled: !!user,
  });

  const { data: referralCode } = useQuery({
    queryKey: ["referral-code", user?.id],
    queryFn: () => accountApi.getReferral(),
    enabled: !!user,
  });

  const { data: loyaltyTransactions = [] } = useQuery({
    queryKey: ["loyalty-transactions", user?.id],
    queryFn: () => accountApi.getTransactions(),
    enabled: !!user,
  });

  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.appointment_date) >= new Date() && apt.status !== "cancelled"
  );
  const pastAppointments = appointments.filter(
    (apt) => new Date(apt.appointment_date) < new Date() || apt.status === "cancelled"
  );

  // Booking transactions — any appointment that has a payment record, newest first.
  const transactions = appointments
    .filter((apt) => apt.payment !== null)
    .sort((a, b) => {
      const at = new Date(a.payment?.paid_at || a.created_at).getTime();
      const bt = new Date(b.payment?.paid_at || b.created_at).getTime();
      return bt - at;
    });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const copyReferralLink = () => {
    if (referralCode) {
      navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${referralCode.code}`);
    }
  };

  // Redirect unauthenticated users after render (never navigate mid-render).
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  if (!user) return null;

  return (
    <Layout>
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={profile?.avatar_url || undefined} alt="Avatar" />
                <AvatarFallback className="bg-primary/10">
                  <User className="h-8 w-8 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-serif font-bold text-foreground">
                  {profileLoading ? <Skeleton className="h-8 w-40" /> : profile?.full_name || "My Account"}
                </h1>
                <p className="text-muted-foreground">{profile?.email || user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ProfileEditDialog
                userId={user.id}
                profile={profile}
                trigger={<Button variant="outline">Edit Profile</Button>}
              />
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
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
              <TabsTrigger value="transactions">
                <Receipt className="h-4 w-4 mr-2" />
                Transactions
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
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={statusColors[apt.status]}>
                                {apt.status}
                              </Badge>
                              <PaymentBadge apt={apt} />
                              {apt.payment &&
                                apt.payment.status !== "paid" &&
                                apt.status !== "cancelled" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handlePay(apt)}
                                    disabled={payingId === apt.id}
                                  >
                                    {payingId === apt.id ? (
                                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    ) : (
                                      <CreditCard className="h-4 w-4 mr-1" />
                                    )}
                                    Pay now
                                  </Button>
                                )}
                            </div>
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
                                <Button variant="outline" size="sm" asChild>
                                  <Link
                                    to={`/review?appointment=${apt.id}${
                                      apt.services?.id ? `&service=${apt.services.id}` : ""
                                    }`}
                                  >
                                    <Star className="h-4 w-4 mr-1" />
                                    Leave a review
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

            <TabsContent value="transactions" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Booking Transactions
                </h2>
                {appointmentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No transactions yet. Payments you make when booking will
                        appear here.
                      </p>
                      <Button asChild>
                        <Link to="/book">Book Now</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((apt) => {
                      const p = apt.payment!;
                      const isPaid = p.status === "paid";
                      return (
                        <Card key={apt.id}>
                          <CardContent className="py-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <Receipt className="h-6 w-6 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-semibold text-foreground">
                                    {apt.services?.name || "Service"}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                                    <span>
                                      {format(
                                        new Date(
                                          p.paid_at || apt.created_at,
                                        ),
                                        "MMM d, yyyy",
                                      )}
                                    </span>
                                    <span>•</span>
                                    <span>
                                      {p.type === "partial"
                                        ? "Deposit"
                                        : "Full payment"}
                                    </span>
                                  </div>
                                  {p.reference && (
                                    <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                                      {p.reference}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-4">
                                <div className="text-right">
                                  <p className="font-bold text-foreground">
                                    GHS {p.amount.toLocaleString()}
                                  </p>
                                  <PaymentBadge apt={apt} />
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!isPaid}
                                  title={
                                    isPaid
                                      ? "Download receipt"
                                      : "Receipt available after payment"
                                  }
                                  onClick={() => {
                                    const data = receiptFromAppointment(apt);
                                    if (data) downloadReceipt(data);
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Receipt
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
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
                        Earn 1 point per GHS 10 spent • use points for up to 30% off any booking
                      </p>
                    </div>
                    <Gift className="h-16 w-16 text-primary/20" />
                  </div>
                </CardContent>
              </Card>

              {/* How points work */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    How your points work
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Earn</span> 1 point
                    for every GHS 10 you spend, added when your appointment is
                    completed.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Redeem</span> at
                    checkout — when you book, flip on “Use my loyalty points” to take
                    up to <span className="font-medium text-foreground">30% off</span>{" "}
                    that service (10 points = GHS 1).
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Refer</span> a friend
                    and earn a 100-point bonus (GHS 10) once they complete their first
                    visit.
                  </p>
                  <Button asChild className="mt-2">
                    <Link to="/book">Book &amp; use points</Link>
                  </Button>
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
                    Share your referral code and earn 100 bonus points (GHS 10 off) when your friend completes their first appointment!
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
