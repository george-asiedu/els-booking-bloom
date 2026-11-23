import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DashboardHeading } from "@/components/dashboard/KpiTile";
import { TwoFactorCard } from "./TwoFactorCard";
import { securityRequest, type SecurityClient, type TwoFactorStatus } from "./securityApi";

/**
 * Admin dashboards stay locked until two-step sign-in is on: the API refuses
 * admin requests without it, so this shows the setup instead of empty pages.
 */
export const TwoFactorGate = ({ client, label, children }: { client: SecurityClient; label?: string; children: ReactNode }) => {
  const status = useQuery({
    queryKey: ["two-factor", client],
    queryFn: () => securityRequest<TwoFactorStatus>(client, "/auth/2fa"),
    staleTime: 5 * 60 * 1000,
  });
  if (status.isLoading)
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  if (status.data && !status.data.enabled && status.data.required !== false)
    return (
      <div className="mx-auto max-w-xl py-6">
        <DashboardHeading
          title="Turn on two-step sign-in"
          subtitle="Admin accounts need it before using the dashboard. It takes a minute: scan a QR code with an authenticator app on your phone."
        />
        <TwoFactorCard client={client} label={label} />
      </div>
    );
  return <>{children}</>;
};
