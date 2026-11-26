import { ZuriMark } from "@/components/ZuriMark";
import { useNoIndex } from "@/lib/seo";
import { TwoFactorGate } from "@/components/security/TwoFactorGate";
import { NotificationBell } from "@/components/security/NotificationBell";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Building2,
  CreditCard,
  GraduationCap,
  Lightbulb,
  Quote,
  Receipt,
  ScrollText,
  Settings,
  Timer,
  Users,
  Wallet,
} from "lucide-react";
import { usePlatformAuth } from "@/hooks/usePlatformAuth";
import { DashboardShell, type NavGroup } from "@/components/dashboard/DashboardShell";

const groups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { name: "Studios & stores", path: "/platform", icon: Building2 },
      { name: "Users", path: "/platform/users", icon: Users },
    ],
  },
  {
    label: "Money",
    items: [
      { name: "Earnings", path: "/platform/earnings", icon: Wallet },
      { name: "Transactions", path: "/platform/transactions", icon: Receipt },
      { name: "Billing & promos", path: "/platform/billing", icon: CreditCard },
    ],
  },
  {
    label: "Community",
    items: [
      { name: "Feature requests", path: "/platform/requests", icon: Lightbulb },
      { name: "Training", path: "/platform/training", icon: GraduationCap },
      { name: "Testimonials", path: "/platform/reviews", icon: Quote },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Jobs", path: "/platform/jobs", icon: Timer },
      { name: "Activity", path: "/platform/audit", icon: ScrollText },
      { name: "API logs", path: "/platform/activity", icon: Activity },
      { name: "Settings", path: "/platform/settings", icon: Settings },
    ],
  },
];

export const PlatformLayout = ({ children }: { children: ReactNode }) => {
  // Private dashboard: keep it out of search results.
  useNoIndex();
  const { user, signOut } = usePlatformAuth();
  const navigate = useNavigate();
  const handleSignOut = () => {
    signOut();
    navigate("/platform/login", { replace: true });
  };
  return (
    <DashboardShell
      exact={["/platform"]}
      groups={groups}
      brand={
        <span className="flex items-center gap-2.5">
          <ZuriMark className="h-6 w-6" />
          <span>
            <span className="block font-semibold">Zuri</span>
            <span className="block text-xs text-band-foreground/55">Platform console</span>
          </span>
        </span>
      }
      user={{ name: "Super admin", email: user?.email }}
      onSignOut={handleSignOut}
      topBar={<NotificationBell client="platform" />}
    >
      <div className="mx-auto max-w-screen-2xl">
        <TwoFactorGate client="platform">{children}</TwoFactorGate>
      </div>
    </DashboardShell>
  );
};
