import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, LogIn, Save, ScrollText, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformLayout } from "./PlatformLayout";
import {
  platformApi,
  StudioDetail,
  StudioFeatureSettings,
  StudioStatus,
} from "@/lib/platformApi";
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

const FEATURES: { key: keyof StudioFeatureSettings; label: string; hint: string }[] =
  [
    { key: "reviews", label: "Reviews", hint: "Customer ratings & testimonials" },
    { key: "gallery", label: "Gallery", hint: "Showcase of past work" },
    { key: "loyalty", label: "Loyalty points", hint: "Earn & redeem points" },
    { key: "referrals", label: "Referrals", hint: "Referral codes & rewards" },
    { key: "commerce", label: "Shop", hint: "Sell products online" },
    {
      key: "onlinePayments",
      label: "Online payments",
      hint: "Paystack checkout for bookings",
    },
    {
      key: "productsInBooking",
      label: "Products in booking",
      hint: "Add products during checkout",
    },
  ];

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border bg-background p-4 text-center">
    <div className="text-2xl font-semibold">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

const PlatformStudioDetail = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [entering, setEntering] = useState(false);

  const { data: studio, isLoading, isError, error } = useQuery({
    queryKey: ["platform", "studio", id],
    queryFn: () => platformApi.getStudio(id),
    enabled: Boolean(id),
  });

  // Per-studio payment transaction audit trail.
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["platform", "studio", id, "payments"],
    queryFn: () =>
      platformApi.listAuditLogs({
        studioId: id,
        actionPrefix: "payment.",
        limit: 200,
      }),
    enabled: Boolean(id),
  });

  // Local editable fields, seeded from the loaded studio.
  const [name, setName] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [feePercent, setFeePercent] = useState(0);
  useEffect(() => {
    if (studio) {
      setName(studio.name);
      setCustomDomain(studio.customDomain ?? "");
      setFeePercent(studio.platformFeePercent ?? 0);
    }
  }, [studio]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["platform", "studio", id] });
    queryClient.invalidateQueries({ queryKey: ["platform", "studios"] });
  };

  const onError = (err: Error) =>
    toast({
      variant: "destructive",
      title: "Update failed",
      description: err.message,
    });

  const detailsMutation = useMutation({
    mutationFn: () =>
      platformApi.updateStudio(id, {
        name,
        customDomain: customDomain.trim() ? customDomain.trim() : null,
        platformFeePercent: feePercent,
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Saved", description: "Studio details updated." });
    },
    onError,
  });

  const statusMutation = useMutation({
    mutationFn: (status: StudioStatus) => platformApi.setStatus(id, status),
    onSuccess: (_d, status) => {
      invalidate();
      toast({
        title: "Status updated",
        description: `Studio is now ${status.toLowerCase()}.`,
      });
    },
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: () => platformApi.deleteStudio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform", "studios"] });
      toast({
        title: "Studio deleted",
        description: "The studio and all its data have been removed.",
      });
      navigate("/platform");
    },
    onError,
  });

  const settingsMutation = useMutation({
    mutationFn: (patch: Partial<StudioFeatureSettings>) =>
      platformApi.updateSettings(id, patch),
    // Optimistically reflect the toggle, roll back on error.
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: ["platform", "studio", id] });
      const prev = queryClient.getQueryData<StudioDetail>([
        "platform",
        "studio",
        id,
      ]);
      if (prev?.settings) {
        queryClient.setQueryData<StudioDetail>(["platform", "studio", id], {
          ...prev,
          settings: { ...prev.settings, ...patch },
        });
      }
      return { prev };
    },
    onError: (err: Error, _patch, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["platform", "studio", id], ctx.prev);
      }
      onError(err);
    },
    onSettled: () => invalidate(),
  });

  const handleEnter = async () => {
    setEntering(true);
    try {
      await enterStudioAsAdmin(id);
    } catch (err) {
      setEntering(false);
      toast({
        variant: "destructive",
        title: "Could not enter studio",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PlatformLayout>
    );
  }

  if (isError || !studio) {
    return (
      <PlatformLayout>
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link to="/platform">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to studios
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            {(error as Error)?.message || "Studio not found."}
          </CardContent>
        </Card>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/platform">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to studios
        </Link>
      </Button>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate font-serif text-2xl font-semibold">
              {studio.name}
            </h1>
            <Badge variant={statusVariant[studio.status]}>
              {studio.status.toLowerCase()}
            </Badge>
            <Badge variant={studio.plan === "PREMIUM" ? "default" : "secondary"}>
              {studio.plan === "PREMIUM" ? "Premium" : "Standard"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            /{studio.slug}
            {studio.owner ? ` · ${studio.owner.email}` : ""}
            {` · ${studio.billingCadence?.toLowerCase() ?? "monthly"} billing`}
            {studio.subscriptionStatus ? ` · ${studio.subscriptionStatus}` : ""}
            {studio.currentPeriodEnd
              ? ` · renews ${new Date(studio.currentPeriodEnd).toLocaleDateString()}`
              : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" asChild>
            <Link to={`/platform/audit?studio=${id}`}>
              <ScrollText className="mr-2 h-4 w-4" />
              Activity
            </Link>
          </Button>
          <Button onClick={handleEnter} disabled={entering}>
            {entering ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            Enter dashboard
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Members" value={studio.counts.userCount} />
        <Stat label="Bookings" value={studio.counts.appointmentCount} />
        <Stat label="Services" value={studio.counts.serviceCount} />
        <Stat label="Orders" value={studio.counts.orderCount} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studio-name">Studio name</Label>
                <Input
                  id="studio-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studio-slug">Slug</Label>
                <Input
                  id="studio-slug"
                  value={studio.slug}
                  disabled
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  The slug can't be changed after creation.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="studio-domain">Custom domain (optional)</Label>
                <Input
                  id="studio-domain"
                  placeholder="book.studio.com"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studio-fee">Platform fee (%)</Label>
                <Input
                  id="studio-fee"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  className="max-w-[140px]"
                  value={feePercent}
                  onChange={(e) => setFeePercent(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Percentage of each transaction the platform keeps.
                  {studio.paystackSubaccountCode
                    ? " Synced to the studio's Paystack subaccount on save."
                    : " Applied once the studio connects a payout account."}
                </p>
              </div>
              <Button
                onClick={() => detailsMutation.mutate()}
                disabled={detailsMutation.isPending}
              >
                {detailsMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(["ACTIVE", "TRIAL", "SUSPENDED"] as StudioStatus[]).map((st) => (
                  <Button
                    key={st}
                    variant={studio.status === st ? "default" : "outline"}
                    size="sm"
                    disabled={studio.status === st || statusMutation.isPending}
                    onClick={() => statusMutation.mutate(st)}
                  >
                    {st.charAt(0) + st.slice(1).toLowerCase()}
                  </Button>
                ))}
              </div>

              {/* Danger zone: permanently delete the studio and all its data. */}
              <div className="border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium text-destructive">
                  Danger zone
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete studio
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {studio.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently removes the studio and everything in it —
                        appointments, orders, payments, products, customers and
                        settings. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => deleteMutation.mutate()}
                      >
                        Delete permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {FEATURES.map((f) => (
              <div key={f.key} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Label htmlFor={`feat-${f.key}`} className="cursor-pointer">
                    {f.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{f.hint}</p>
                </div>
                <Switch
                  id={`feat-${f.key}`}
                  checked={Boolean(studio.settings?.[f.key])}
                  disabled={settingsMutation.isPending}
                  onCheckedChange={(v) =>
                    settingsMutation.mutate({ [f.key]: v })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Payment transactions audit log (per studio) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4 text-primary" />
            Payment transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : payments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No payment transactions recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">When</th>
                    <th className="py-2 pr-3 font-medium">Event</th>
                    <th className="py-2 pr-3 font-medium">Amount</th>
                    <th className="py-2 pr-3 font-medium">Channel</th>
                    <th className="py-2 pr-3 font-medium">Customer</th>
                    <th className="py-2 pr-3 font-medium">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const m = (p.metadata ?? {}) as Record<string, unknown>;
                    const amount = m.amount as number | undefined;
                    const failed = p.action.endsWith(".failed");
                    return (
                      <tr key={p.id} className="border-b last:border-0 align-top">
                        <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                          {new Date(p.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge variant={failed ? "destructive" : "secondary"}>
                            {paymentEventLabel(p.action)}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap font-medium">
                          {typeof amount === "number" ? `₵${amount.toLocaleString()}` : "—"}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {(m.channel as string) ?? "—"}
                        </td>
                        <td className="py-2 pr-3">
                          {(m.customerName as string) ||
                            (m.customerEmail as string) ||
                            (m.ownerEmail as string) ||
                            "—"}
                        </td>
                        <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">
                          {(m.reference as string) ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PlatformLayout>
  );
};

// Human labels for the payment audit action codes.
const paymentEventLabel = (action: string): string => {
  const map: Record<string, string> = {
    "payment.booking.succeeded": "Booking paid",
    "payment.booking.failed": "Booking failed",
    "payment.order.succeeded": "Order paid",
    "payment.order.failed": "Order failed",
    "payment.signup.succeeded": "Signup paid",
    "payment.renewal.succeeded": "Renewal",
    "payment.plan_change.succeeded": "Plan change",
  };
  return map[action] ?? action.replace(/^payment\./, "").replace(/\./g, " ");
};

export default PlatformStudioDetail;
