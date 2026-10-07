import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { RescheduleDialog } from "@/components/admin/RescheduleDialog";
import { Calendar, Gift, Share2, User, LogOut, Receipt, ShoppingBag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/layout/Layout";
import { PaymentDialog } from "@/components/payment/PaymentDialog";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/hooks/useStudio";
import {
  profileApi,
  appointmentsApi,
  accountApi,
  paymentsApi,
  ordersApi,
  cartApi,
  commerceApi,
  type AppointmentDTO,
  type PaymentTarget,
} from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileEditDialog } from "@/components/account/ProfileEditDialog";
import { useToast } from "@/hooks/use-toast";
import type { DocumentBrand } from "@/lib/receipt";
import { splitByDay } from "./accountFormat";
import { AppointmentsTab } from "./AppointmentsTab";
import { OrdersTab } from "./OrdersTab";
import { TransactionsTab } from "./TransactionsTab";
import { RewardsTab } from "./RewardsTab";

const Account = () => {
  const { user, signOut } = useAuth();
  const { features, config, name: studioName } = useStudio();
  const loyaltyCap = config?.settings.loyaltyCapPercent ?? 30;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const initialTab = searchParams.get("tab") || "appointments";
  const [payingId, setPayingId] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState<AppointmentDTO | null>(
    null,
  );
  const [paymentTarget, setPaymentTarget] = useState<PaymentTarget | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payAppt, setPayAppt] = useState<{
    id: string;
    type: "FULL" | "PARTIAL";
  } | null>(null);

  // Resume/complete a payment for an existing booking — in-app dialog.
  const handlePay = async (apt: AppointmentDTO) => {
    if (!apt.payment) return;
    const type = apt.payment.type === "partial" ? "PARTIAL" : "FULL";
    try {
      setPayingId(apt.id);
      const init = await paymentsApi.initialize(apt.id, type);
      setPayAppt({ id: apt.id, type });
      setPaymentTarget({
        reference: init.reference,
        amount: init.amount,
        email: init.email,
        access_code: init.access_code,
        subaccount: init.subaccount,
        public_key: init.public_key,
      });
      setPaymentOpen(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn't start payment",
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setPayingId(null);
    }
  };

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => profileApi.getMine(),
    enabled: !!user,
  });

  const appointmentsQuery = useInfiniteQuery({
    queryKey: ["my-appointments", user?.id, "cursor-pages"],
    queryFn: ({ pageParam }) => appointmentsApi.listMinePage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!user,
  });
  const appointments = appointmentsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const appointmentsLoading = appointmentsQuery.isLoading;

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

  const { data: commerce } = useQuery({
    queryKey: ["commerce-settings"],
    queryFn: () => commerceApi.getSettings(),
  });
  const shopEnabled = features.commerce && (commerce?.enabled ?? false);

  const ordersQuery = useInfiniteQuery({
    queryKey: ["my-orders", user?.id, "cursor-pages"],
    queryFn: ({ pageParam }) => ordersApi.listMinePage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!user,
  });
  const orders = ordersQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartApi.getMine(),
    enabled: !!user,
  });

  const { upcoming: upcomingAppointments, past: pastAppointments } =
    splitByDay(appointments);
  // Studio branding for downloaded booking documents and receipts.
  const documentBrand: DocumentBrand = {
    name: studioName,
    primaryColor: config?.branding.primaryColor,
    accentColor: config?.branding.accentColor,
  };

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

  const copyReferralLink = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/signup?ref=${referralCode.code}`,
      );
      toast({ title: "Referral link copied" });
    } catch {
      toast({
        variant: "destructive",
        title: "Couldn't copy the link",
        description: `Your code is ${referralCode.code}.`,
      });
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar className="w-16 h-16 shrink-0">
                <AvatarImage src={profile?.avatar_url || undefined} alt="Avatar" />
                <AvatarFallback className="bg-primary/10">
                  <User className="h-8 w-8 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="text-2xl font-serif font-bold text-foreground truncate">
                  {profileLoading ? <Skeleton className="h-8 w-40" /> : profile?.full_name || "My Account"}
                </h1>
                <p className="text-muted-foreground truncate">{profile?.email || user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {shopEnabled && (
                <Button variant="outline" asChild>
                  <Link to="/shop">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Shop
                  </Link>
                </Button>
              )}
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
            {features.loyalty && (
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
            )}

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

            {features.referrals && (
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
            )}
          </div>

          <Tabs defaultValue={initialTab} className="space-y-6">
            <TabsList className="flex w-full flex-wrap h-auto sm:inline-flex sm:w-auto sm:flex-nowrap">
              <TabsTrigger value="appointments">
                <Calendar className="h-4 w-4 mr-2" />
                Appointments
              </TabsTrigger>
              {features.commerce && (
                <TabsTrigger value="orders">
                  <Package className="h-4 w-4 mr-2" />
                  Orders
                </TabsTrigger>
              )}
              <TabsTrigger value="transactions">
                <Receipt className="h-4 w-4 mr-2" />
                Transactions
              </TabsTrigger>
              {(features.loyalty || features.referrals) && (
                <TabsTrigger value="rewards">
                  <Gift className="h-4 w-4 mr-2" />
                  Rewards
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="appointments" className="space-y-6">
              <AppointmentsTab
                upcoming={upcomingAppointments}
                past={pastAppointments}
                loading={appointmentsLoading}
                pager={appointmentsQuery}
                brand={documentBrand}
                reviewsEnabled={features.reviews}
                payingId={payingId}
                onPay={handlePay}
                onReschedule={setRescheduling}
              />
            </TabsContent>

            {features.commerce && (
              <TabsContent value="orders" className="space-y-6">
                <OrdersTab
                  cart={cart}
                  orders={orders}
                  pager={ordersQuery}
                  shopEnabled={shopEnabled}
                  brand={documentBrand}
                />
              </TabsContent>
            )}

            <TabsContent value="transactions" className="space-y-6">
              <TransactionsTab
                transactions={transactions}
                loading={appointmentsLoading}
                pager={appointmentsQuery}
                brand={documentBrand}
              />
            </TabsContent>

            {(features.loyalty || features.referrals) && (
              <TabsContent value="rewards" className="space-y-6">
                <RewardsTab
                  loyaltyEnabled={features.loyalty}
                  referralsEnabled={features.referrals}
                  loyaltyCapPercent={loyaltyCap}
                  loyalty={loyaltyData}
                  referralCode={referralCode}
                  history={loyaltyTransactions}
                  onCopyReferralLink={copyReferralLink}
                />
              </TabsContent>
            )}
          </Tabs>

      <RescheduleDialog
        appointment={rescheduling}
        onOpenChange={(o) => !o && setRescheduling(null)}
        audience="customer"
        invalidateKeys={["my-appointments"]}
      />

        </div>
      </section>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        target={paymentTarget}
        title="Complete your payment"
        momoCharge={
          payAppt
            ? (phone, provider) =>
                paymentsApi.chargeMomo({
                  appointmentId: payAppt.id,
                  type: payAppt.type,
                  phone,
                  provider,
                })
            : undefined
        }
        onSuccess={(reference) =>
          navigate(`/payment/callback?reference=${encodeURIComponent(reference)}`)
        }
      />
    </Layout>
  );
};

export default Account;
