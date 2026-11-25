import { ReactNode } from "react";
import { GetStartedBox } from "@/components/admin/GetStartedBox";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Calendar,
  Clock,
  CreditCard,
  ExternalLink,
  Globe,
  HardDrive,
  ImageIcon,
  LayoutDashboard,
  Lightbulb,
  CalendarDays,
  UserRound,
  GraduationCap,
  Gift,
  Wallet,
  ShieldCheck,
  Megaphone,
  Package,
  Palette,
  Phone,
  Quote,
  Receipt,
  Rocket,
  Scissors,
  ShoppingBag,
  Star,
  Store,
  Flame,
  Sparkles,
  Tag,
  TicketPercent,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/hooks/useStudio";
import { studioUrl } from "@/config/platform";
import { profileApi } from "@/lib/api";
import { TwoFactorGate } from "@/components/security/TwoFactorGate";
import { NotificationBell } from "@/components/security/NotificationBell";
import { ProfileEditDialog } from "@/components/account/ProfileEditDialog";
import { StudioMark } from "@/components/StudioMark";
import { BillingBadge, BillingMarquee } from "@/components/admin/BillingReminder";
import { DashboardShell, type NavGroup } from "@/components/dashboard/DashboardShell";

type Features = ReturnType<typeof useStudio>["features"];

// A studio takes bookings (and may have a shop); a Zuri Stores is a shop
// only, so it gets its own menu with no booking pages.
const studioNav = (f: Features): NavGroup[] => [
  {
    label: "General",
    items: [
      { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
      { name: "Setup", path: "/admin/onboarding", icon: Rocket },
      { name: "Insights", path: "/admin/insights", icon: Sparkles },
      { name: "Analytics", path: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Bookings",
    items: [
      { name: "Appointments", path: "/admin/appointments", icon: Calendar },
      { name: "Calendar", path: "/admin/calendar", icon: CalendarDays },
      { name: "Services", path: "/admin/services", icon: Scissors },
      { name: "Staff", path: "/admin/staff", icon: UserRound },
      { name: "Categories", path: "/admin/categories", icon: Tag },
      { name: "Hours", path: "/admin/hours", icon: Clock },
      { name: "Customers", path: "/admin/users", icon: Users },
    ],
  },
  ...(f.commerce
    ? [
        {
          label: "Shop",
          items: [
            { name: "Orders", path: "/admin/orders", icon: Package },
            { name: "Products", path: "/admin/products", icon: ShoppingBag },
            { name: "Product categories", path: "/admin/product-categories", icon: Tag },
            { name: "Coupons", path: "/admin/coupons", icon: TicketPercent },
            { name: "Sales", path: "/admin/sales", icon: Flame },
            { name: "Shop settings", path: "/admin/commerce", icon: Store },
          ],
        },
      ]
    : []),
  {
    label: "Website",
    items: [
      { name: "Appearance", path: "/admin/appearance", icon: Palette },
      ...(f.gallery ? [{ name: "Gallery", path: "/admin/gallery", icon: ImageIcon }] : []),
      { name: "Storage", path: "/admin/storage", icon: HardDrive },
      { name: "Reviews", path: "/admin/reviews", icon: Star },
      { name: "Promotions", path: "/admin/promos", icon: Megaphone },
      { name: "Custom domain", path: "/admin/domain", icon: Globe },
      { name: "Contact", path: "/admin/contact", icon: Phone },
    ],
  },
  ...moneyAndMore,
];

const storeNav: NavGroup[] = [
  {
    label: "General",
    items: [
      { name: "Overview", path: "/admin", icon: LayoutDashboard },
      { name: "Setup", path: "/admin/onboarding", icon: Rocket },
      { name: "Insights", path: "/admin/insights", icon: Sparkles },
    ],
  },
  {
    label: "Store",
    items: [
      { name: "Orders", path: "/admin/orders", icon: Package },
      { name: "Products", path: "/admin/products", icon: ShoppingBag },
      { name: "Categories", path: "/admin/product-categories", icon: Tag },
      { name: "Coupons", path: "/admin/coupons", icon: TicketPercent },
      { name: "Sales", path: "/admin/sales", icon: Flame },
      { name: "Customers", path: "/admin/users", icon: Users },
      { name: "Reviews", path: "/admin/reviews", icon: Star },
      { name: "Store settings", path: "/admin/commerce", icon: Store },
    ],
  },
  {
    label: "Website",
    items: [
      { name: "Appearance", path: "/admin/appearance", icon: Palette },
      { name: "Promotions", path: "/admin/promos", icon: Megaphone },
      { name: "Custom domain", path: "/admin/domain", icon: Globe },
      { name: "Contact", path: "/admin/contact", icon: Phone },
    ],
  },
];

const moneyAndMore: NavGroup[] = [
  {
    label: "Money",
    items: [
      { name: "Payments", path: "/admin/payments", icon: CreditCard },
      { name: "Bills", path: "/admin/bills", icon: Receipt },
      { name: "Transactions", path: "/admin/transactions", icon: Receipt },
      { name: "Expenses", path: "/admin/expenses", icon: Wallet },
      { name: "Gift cards", path: "/admin/gift-cards", icon: Gift },
      { name: "Billing & plan", path: "/admin/billing", icon: CreditCard },
    ],
  },
  {
    label: "More",
    items: [
      { name: "Learn Zuri", path: "/admin/learn", icon: GraduationCap },
      { name: "Share your story", path: "/admin/testimonial", icon: Quote },
      { name: "Feature requests", path: "/admin/feature-requests", icon: Lightbulb },
      { name: "Security & alerts", path: "/admin/security", icon: ShieldCheck },
    ],
  },
];

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { name: studioName, config, features } = useStudio();
  const isStore = features.booking === false;
  const groups = isStore ? [...storeNav, ...moneyAndMore] : studioNav(features);
  // This studio's own site (subdomain in prod, /s/<slug> in dev), not "/".
  const publicSiteUrl = config?.slug ? studioUrl(config.slug) : "/";

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => profileApi.getMine(),
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <DashboardShell
      exact={["/admin"]}
      groups={groups}
      brand={
        <span className="flex min-w-0 items-center gap-2.5">
          <StudioMark name={studioName} logoUrl={config?.branding.logoUrl} />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{studioName}</span>
            <span className="block text-xs text-band-foreground/55">{isStore ? "Store admin" : "Studio admin"}</span>
          </span>
        </span>
      }
      user={{ name: profile?.full_name || user?.email || "Admin", email: user?.email }}
      onSignOut={handleSignOut}
      banner={<BillingMarquee />}
      footerLink={
        <a href={publicSiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-band-foreground/70 hover:text-band-foreground">
          <ExternalLink className="h-4 w-4" aria-hidden /> View your {isStore ? "store" : "website"}
        </a>
      }
      topBar={
        <>
          <BillingBadge />
          <NotificationBell client="studio" />
          {user && (
            <ProfileEditDialog
              userId={user.id}
              profile={profile}
              trigger={
                <Button variant="ghost" size="sm">
                  <User className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">My profile</span>
                </Button>
              }
            />
          )}
        </>
      }
    >
      <TwoFactorGate client="studio" label={studioName}>
        {children}
      </TwoFactorGate>
      <GetStartedBox />
    </DashboardShell>
  );
};
