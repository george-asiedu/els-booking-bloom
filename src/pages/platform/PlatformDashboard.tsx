import { useState } from "react";
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

const Stat = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) => (
  <Card>
    <CardContent className="py-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">
        {label}
        {sub ? ` · ${sub}` : ""}
      </div>
    </CardContent>
  </Card>
);

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
            {studios ? `${studios.length} studio(s) on your platform` : " "}
          </p>
        </div>
        <Button asChild>
          <Link to="/platform/studios/new">
            <Plus className="mr-2 h-4 w-4" />
            New studio
          </Link>
        </Button>
      </div>

      {/* Platform analytics */}
      {analytics && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Total revenue" value={`GHS ${analytics.totalRevenue.toLocaleString()}`} />
          <Stat label="Total users" value={analytics.totalUsers.toLocaleString()} />
          <Stat
            label="Active studios"
            value={`${analytics.activeStudios}`}
            sub={`of ${analytics.totalStudios}`}
          />
          <Stat
            label="Suspended"
            value={`${analytics.suspendedStudios}`}
            sub={analytics.trialStudios ? `${analytics.trialStudios} trial` : undefined}
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
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studios?.map((s) => {
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
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        GHS {s.revenue.toLocaleString()}
                      </TableCell>
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
        </Card>
      )}
    </PlatformLayout>
  );
};

export default PlatformDashboard;
