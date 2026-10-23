import { useState } from "react";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePagedList } from "@/hooks/usePagedList";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Plus,
  ExternalLink,
  Ban,
  Play,
  LogIn,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlatformLayout } from "./PlatformLayout";
import { platformApi, StudioSummary, StudioStatus } from "@/lib/platformApi";
import { enterStudioAsAdmin } from "@/lib/impersonate";
import { useToast } from "@/hooks/use-toast";
import { formatGHS } from "@/lib/currency";

const statusVariant: Record<
  StudioStatus,
  "default" | "secondary" | "destructive"
> = {
  ACTIVE: "default",
  TRIAL: "secondary",
  SUSPENDED: "destructive",
};

const StatusBadge = ({ status }: { status: StudioStatus }) => (
  <Badge variant={statusVariant[status]}>{status.toLowerCase()}</Badge>
);

/** "+12% vs last month" (or a plain note when last month was zero). */
const VsLastMonth = ({ now, before }: { now: number; before: number }) => {
  if (before === 0) {
    return <span>{now === 0 ? "Nothing yet this month or last" : "Nothing last month"}</span>;
  }
  const pct = Math.round(((now - before) / before) * 100);
  return (
    <span>
      <span className={pct >= 0 ? "font-medium text-emerald-700 dark:text-emerald-400" : "font-medium text-rose-700 dark:text-rose-400"}>
        {pct >= 0 ? "+" : ""}
        {pct}%
      </span>{" "}
      vs {formatGHS(before)} last month
    </span>
  );
};

/**
 * One headline figure: what it is, the number, its comparison, and the
 * breakdown behind it, so nothing on the card needs guessing.
 */
const Stat = ({
  title,
  hint,
  value,
  period,
  compare,
  breakdown,
  to,
}: {
  title: string;
  hint: string;
  value: string;
  period?: string;
  compare?: React.ReactNode;
  breakdown: { label: string; value: string }[];
  to?: string;
}) => {
  const body = (
    <Card className={cn("h-full", to && "transition-colors hover:border-primary/40")}>
      <CardContent className="flex h-full flex-col gap-1 p-5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
          {value}
          {period && <span className="ml-1.5 text-sm font-normal text-muted-foreground">{period}</span>}
        </p>
        {compare && <p className="text-xs text-muted-foreground">{compare}</p>}
        <dl className="mt-auto space-y-1 border-t pt-3 text-xs">
          {breakdown.map((b) => (
            <div key={b.label} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{b.label}</dt>
              <dd className="font-medium tabular-nums">{b.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
  return to ? (
    <Link to={to} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </Link>
  ) : (
    body
  );
};

const PlatformDashboard = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");

  const { data: allStudios, isLoading, isError, error } = useQuery({
    queryKey: ["platform", "studios"],
    queryFn: () => platformApi.listStudios(),
  });
  const { data: analytics } = useQuery({
    queryKey: ["platform", "analytics"],
    queryFn: () => platformApi.getAnalytics(),
  });

  const studios = allStudios?.filter(
    (s) => filter === "ALL" || s.status === filter,
  );
  const paged = usePagedList(studios ?? [], 15);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StudioStatus }) =>
      platformApi.setStatus(id, status),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["platform", "studios"] });
      toast({
        title: "Studio updated",
        description: `Status set to ${vars.status.toLowerCase()}.`,
      });
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err.message,
      });
    },
    onSettled: () => setBusyId(null),
  });

  const handleEnter = async (studio: StudioSummary) => {
    setBusyId(studio.id);
    try {
      await enterStudioAsAdmin(studio.id);
    } catch (err) {
      setBusyId(null);
      toast({
        variant: "destructive",
        title: "Could not enter studio",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  return (
    <PlatformLayout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Studios</h1>
          <p className="text-sm text-muted-foreground">
            {allStudios
              ? `${allStudios.length} ${allStudios.length === 1 ? "studio" : "studios"} on your platform`
              : " "}
          </p>
        </div>
        <Button asChild>
          <Link to="/platform/studios/new">
            <Plus className="mr-2 h-4 w-4" />
            New studio
          </Link>
        </Button>
      </div>

      {/* Platform figures. Two kinds of money, kept apart and labelled:
          what studios paid the platform, and what customers paid studios. */}
      {analytics && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            title="Your earnings"
            hint="What studios have paid Zuri Studios"
            value={formatGHS(analytics.platformEarnings.thisMonth)}
            period="this month"
            compare={<VsLastMonth now={analytics.platformEarnings.thisMonth} before={analytics.platformEarnings.lastMonth} />}
            breakdown={[
              { label: "All time", value: formatGHS(analytics.platformEarnings.allTime) },
              { label: "Setup fees", value: formatGHS(analytics.platformEarnings.setupFeesAllTime) },
              { label: "Renewals and plan changes", value: formatGHS(analytics.platformEarnings.renewalsAllTime) },
              { label: "Commission (estimated)", value: formatGHS(analytics.platformEarnings.commissionsAllTime) },
            ]}
            to="/platform/billing"
          />
          <Stat
            title="Customer payments"
            hint="What customers paid studios, after refunds"
            value={formatGHS(analytics.customerPayments.thisMonth)}
            period="this month"
            compare={<VsLastMonth now={analytics.customerPayments.thisMonth} before={analytics.customerPayments.lastMonth} />}
            breakdown={[
              { label: "All time", value: formatGHS(analytics.customerPayments.allTime) },
              { label: "Bookings", value: formatGHS(analytics.customerPayments.bookingsAllTime) },
              { label: "Shop orders", value: formatGHS(analytics.customerPayments.ordersAllTime) },
            ]}
            to="/platform/transactions"
          />
          <Stat
            title="Studios"
            hint="Businesses on the platform"
            value={String(analytics.studios.total)}
            compare={`${analytics.studios.newThisMonth} new this month`}
            breakdown={[
              { label: "Active", value: String(analytics.studios.active) },
              { label: "Suspended", value: String(analytics.studios.suspended) },
              { label: "On a subscription", value: String(analytics.studios.subscription) },
              { label: "Pay as you earn", value: String(analytics.studios.revenueShare) },
            ]}
          />
          <Stat
            title="Users"
            hint="Studio customers and admins (not you)"
            value={String(analytics.users.customers + analytics.users.studioAdmins)}
            compare={`${analytics.users.newThisMonth} joined this month`}
            breakdown={[
              { label: "Customers", value: String(analytics.users.customers) },
              { label: "Studio admins", value: String(analytics.users.studioAdmins) },
            ]}
            to="/platform/users"
          />
        </div>
      )}

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["ALL", "ACTIVE", "SUSPENDED"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f === "ALL" ? "All" : f === "ACTIVE" ? "Active" : "Inactive"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            {(error as Error)?.message || "Failed to load studios."}
          </CardContent>
        </Card>
      ) : studios && studios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No studios yet.</p>
            <Button asChild>
              <Link to="/platform/studios/new">
                <Plus className="mr-2 h-4 w-4" />
                Create your first studio
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Studio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Customer payments</TableHead>
                  <TableHead className="text-right">Paid to you</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.rows.map((s) => {
                  const busy =
                    busyId === s.id ||
                    (statusMutation.isPending &&
                      statusMutation.variables?.id === s.id);
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Link
                          to={`/platform/studios/${s.id}`}
                          className="font-medium hover:underline"
                        >
                          {s.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          /{s.slug}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={s.status} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.plan === "PREMIUM" ? "default" : "secondary"}>
                          {s.plan === "PREMIUM" ? "Premium" : "Standard"}
                        </Badge>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {s.billingMode === "REVENUE_SHARE"
                            ? `Pay as you earn · ${s.platformFeePercent}%`
                            : s.billingCadence === "YEARLY"
                              ? "Yearly"
                              : "Monthly"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="tabular-nums">{formatGHS(s.revenue)}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {formatGHS(s.revenueThisMonth)} this month
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatGHS(s.paidToPlatform)}</TableCell>
                      <TableCell className="text-right">{s.userCount}</TableCell>
                      <TableCell className="text-right">
                        {s.appointmentCount}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            title="View details"
                          >
                            <Link to={`/platform/studios/${s.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            title="Enter admin dashboard"
                            onClick={() => handleEnter(s)}
                          >
                            {busyId === s.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <LogIn className="h-4 w-4" />
                            )}
                          </Button>
                          {s.status === "SUSPENDED" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              title="Reactivate"
                              onClick={() => {
                                setBusyId(s.id);
                                statusMutation.mutate({
                                  id: s.id,
                                  status: "ACTIVE",
                                });
                              }}
                            >
                              <Play className="h-4 w-4 text-green-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              title="Suspend"
                              onClick={() => {
                                setBusyId(s.id);
                                statusMutation.mutate({
                                  id: s.id,
                                  status: "SUSPENDED",
                                });
                              }}
                            >
                              <Ban className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={paged.page}
            pageSize={paged.pageSize}
            total={paged.total}
            onPageChange={paged.setPage}
            noun="studios"
          />
        </Card>
      )}
    </PlatformLayout>
  );
};

export default PlatformDashboard;
