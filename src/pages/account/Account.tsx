import { useEffect, useState } from "react";
import { PROCESSING, useProcessing } from "@/components/ProcessingOverlay";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { RescheduleDialog } from "@/components/admin/RescheduleDialog";
import { Calendar, CalendarPlus, Gift, Heart, Home, Package, Receipt, Share2, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardShell, type NavGroup } from "@/components/dashboard/DashboardShell";
import { DashboardHeading, KpiTile } from "@/components/dashboard/KpiTile";
import { StudioMark } from "@/components/StudioMark";
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
import { ProfileEditDialog } from "@/components/account/ProfileEditDialog";
import { useToast } from "@/hooks/use-toast";
import type { DocumentBrand } from "@/lib/receipt";
import { splitByDay } from "./accountFormat";
import { AppointmentsTab } from "./AppointmentsTab";
import { OrdersTab } from "./OrdersTab";
import { VerifyEmailCard } from "./VerifyEmailCard";
import { TransactionsTab } from "./TransactionsTab";
import { RewardsTab } from "./RewardsTab";

const Account = () => {
  const { user, signOut } = useAuth();
  const { features, config, name: studioName } = useStudio();
  const loyaltyCap = config?.settings.loyaltyCapPercent ?? 30;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const processing = useProcessing();
  // A Zuri Storefront has no bookings: its customers see orders first.
  const booking = features.booking !== false;
  const initialTab = searchParams.get("tab") || (booking ? "appointments" : "orders");
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
      processing.show(PROCESSING.preparing);
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
      processing.hide();
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
    enabled: !!user && booking,
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

  const sections = [
    ...(booking ? [{ id: "appointments", name: "Appointments", icon: Calendar }] : []),
    ...(features.commerce ? [{ id: "orders", name: "Orders", icon: Package }] : []),
    // Booking payments; a store's payments are its orders.
    ...(booking ? [{ id: "transactions", name: "Transactions", icon: Receipt }] : []),
    ...(features.loyalty || features.referrals ? [{ id: "rewards", name: "Rewards", icon: Gift }] : []),
  ];
  const tab = sections.some((x) => x.id === searchParams.get("tab")) ? searchParams.get("tab")! : initialTab;
  const groups: NavGroup[] = [
    {
      label: "My account",
      items: sections.map((x) => ({ name: x.name, path: `/account?tab=${x.id}`, icon: x.icon, active: tab === x.id })),
    },
    {
      label: studioName,
      items: [
        { name: booking ? "Our website" : "Home", path: "/", icon: Home, active: false },
        ...(booking ? [{ name: "Book an appointment", path: "/book", icon: CalendarPlus, active: false }] : []),
        ...(shopEnabled ? [{ name: "Shop", path: booking ? "/shop" : "/shop/products", icon: ShoppingBag, active: false }] : []),
        ...(shopEnabled ? [{ name: "Wishlist", path: "/wishlist", icon: Heart, active: false }] : []),
      ],
    },
  ];
  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <DashboardShell
      groups={groups}
      brand={
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <StudioMark name={studioName} logoUrl={config?.branding.logoUrl} />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{studioName}</span>
            <span className="block text-xs text-band-foreground/55">My account</span>
          </span>
        </Link>
      }
      user={{
        name: profile?.full_name || user.email,
        email: profile?.email || user.email,
        avatar: (
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} alt="" />
            <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
              {(profile?.full_name || user.email).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ),
      }}
      onSignOut={handleSignOut}
      topBar={
        <ProfileEditDialog
          userId={user.id}
          profile={profile}
          trigger={
            <Button variant="ghost" size="sm">
              <User className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Edit profile</span>
            </Button>
          }
        />
      }
    >
      <div className="mx-auto max-w-screen-2xl">
          <DashboardHeading
            title={profileLoading ? "Welcome back" : `Welcome back${firstName ? `, ${firstName}` : ""}`}
            subtitle={`Your ${booking ? "bookings, orders" : "orders"} and rewards at ${studioName}.`}
            actions={
              booking ? (
                <Button asChild>
                  <Link to="/book">Book an appointment</Link>
                </Button>
              ) : shopEnabled ? (
                <Button asChild>
                  <Link to="/shop/products">Continue shopping</Link>
                </Button>
              ) : undefined
            }
          />

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.loyalty && (
              <KpiTile
                tone="amber"
                label="Loyalty points"
                value={String(loyaltyData?.points || 0)}
                icon={<Gift className="h-5 w-5" />}
                hint={`${loyaltyData?.lifetime_points || 0} earned in total`}
                to="/account?tab=rewards"
              />
            )}
            {booking && (
              <KpiTile
                tone="blue"
                label="Upcoming appointments"
                value={String(upcomingAppointments.length)}
                icon={<Calendar className="h-5 w-5" />}
                hint={`${appointments.length} bookings in total`}
                to="/account?tab=appointments"
              />
            )}
            {!booking && features.commerce && (
              <KpiTile
                tone="blue"
                label="Orders"
                value={String(orders.length)}
                icon={<Package className="h-5 w-5" />}
                hint={cart?.items.length ? `${cart.count} in your bag` : "Nothing in your bag"}
                to="/account?tab=orders"
              />
            )}
            {features.referrals && (
              <KpiTile
                tone="green"
                label="Your referral code"
                value={referralCode?.code || "—"}
                icon={<Share2 className="h-5 w-5" />}
                hint={`${referralCode?.uses || 0} friends referred`}
              >
                <Button size="sm" variant="outline" className="bg-background/70" onClick={copyReferralLink}>
                  Copy invite link
                </Button>
              </KpiTile>
            )}
          </div>

          {user.role === "CUSTOMER" && <VerifyEmailCard email={user.email} />}

          {/* The sidebar picks the section; this row is for phones and
              mirrors it. */}
          <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v })} className="space-y-6">
            <TabsList className="flex h-auto w-full flex-wrap md:hidden">
              {booking && (
                <TabsTrigger value="appointments">
                  <Calendar className="h-4 w-4 mr-2" />
                  Appointments
                </TabsTrigger>
              )}
              {features.commerce && (
                <TabsTrigger value="orders">
                  <Package className="h-4 w-4 mr-2" />
                  Orders
                </TabsTrigger>
              )}
              {booking && (
                <TabsTrigger value="transactions">
                  <Receipt className="h-4 w-4 mr-2" />
                  Transactions
                </TabsTrigger>
              )}
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
    </DashboardShell>
  );
};

export default Account;
