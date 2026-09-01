import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PaystackPop from "@paystack/inline-js";
import { Loader2, CreditCard, Check, Crown } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { studioBillingApi } from "@/lib/api";
import { PLANS, planPrice } from "@/config/platform";
import { useToast } from "@/hooks/use-toast";

const GHS = (n: number) => `₵${n.toLocaleString()}`;

const AdminBilling = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [cadence, setCadence] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [busy, setBusy] = useState(false);

  const { data: billing, isLoading } = useQuery({
    queryKey: ["studio-billing"],
    queryFn: () => studioBillingApi.get(),
  });

  const changeTo = async (plan: "STANDARD" | "PREMIUM") => {
    if (billing && billing.plan === plan && billing.cadence === cadence) {
      toast({ title: "You're already on this plan." });
      return;
    }
    setBusy(true);
    try {
      const { reference, accessCode } = await studioBillingApi.startChange({
        plan,
        cadence,
      });
      const popup = new PaystackPop();
      popup.resumeTransaction(accessCode, {
        onSuccess: async () => {
          try {
            await studioBillingApi.applyChange({ reference, plan, cadence });
            queryClient.invalidateQueries({ queryKey: ["studio-billing"] });
            queryClient.invalidateQueries({ queryKey: ["studio-config"] });
            toast({
              title: "Plan updated",
              description: `You're now on ${plan === "PREMIUM" ? "Premium" : "Standard"}.`,
            });
          } catch (err) {
            toast({
              variant: "destructive",
              title: "Payment received, but the switch didn't apply",
              description: err instanceof Error ? err.message : "Please contact support.",
            });
          } finally {
            setBusy(false);
          }
        },
        onCancel: () => setBusy(false),
        onError: (e: { message?: string }) => {
          setBusy(false);
          toast({ variant: "destructive", title: "Payment failed", description: e?.message });
        },
      });
    } catch (error) {
      setBusy(false);
      toast({
        variant: "destructive",
        title: "Couldn't start the change",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const renew = async () => {
    setBusy(true);
    try {
      const { reference, accessCode } = await studioBillingApi.startRenewal();
      const popup = new PaystackPop();
      popup.resumeTransaction(accessCode, {
        onSuccess: async () => {
          try {
            await studioBillingApi.applyRenewal({ reference });
            queryClient.invalidateQueries({ queryKey: ["studio-billing"] });
            queryClient.invalidateQueries({ queryKey: ["studio-config"] });
            toast({
              title: "Renewed",
              description: "Your plan has been extended for another period.",
            });
          } catch (err) {
            toast({
              variant: "destructive",
              title: "Payment received, but the renewal didn't apply",
              description: err instanceof Error ? err.message : "Please contact support.",
            });
          } finally {
            setBusy(false);
          }
        },
        onCancel: () => setBusy(false),
        onError: (e: { message?: string }) => {
          setBusy(false);
          toast({ variant: "destructive", title: "Payment failed", description: e?.message });
        },
      });
    } catch (error) {
      setBusy(false);
      toast({
        variant: "destructive",
        title: "Couldn't start the renewal",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <CreditCard className="h-6 w-6 text-primary" />
            Billing & plan
          </h1>
          <p className="text-muted-foreground">
            Manage your plan. Upgrade, downgrade or switch billing period anytime,
            and renew each period with Mobile Money.
          </p>
        </div>

        {isLoading || !billing ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : billing.billingMode === "REVENUE_SHARE" ? (
          <Card>
            <CardContent className="space-y-3 py-6">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Current plan</span>
                <Badge variant={billing.plan === "PREMIUM" ? "default" : "secondary"}>
                  {billing.plan === "PREMIUM" ? "Premium" : "Standard"}
                </Badge>
                <Badge variant="outline">Pay as you earn</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your account bills per transaction — the platform takes{" "}
                <span className="font-semibold text-foreground">
                  {billing.commissionPercent}%
                </span>{" "}
                of each customer payment. There's no recurring plan fee and nothing
                to renew. To change your plan or billing, contact the Zuri team.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className={billing.lapsed ? "border-destructive" : ""}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Current plan</span>
                    <Badge variant={billing.plan === "PREMIUM" ? "default" : "secondary"}>
                      {billing.plan === "PREMIUM" ? "Premium" : "Standard"}
                    </Badge>
                    <Badge variant="outline">
                      {billing.cadence === "YEARLY" ? "Yearly" : "Monthly"}
                    </Badge>
                    <Badge variant={billing.lapsed ? "destructive" : "secondary"}>
                      {billing.lapsed ? "Lapsed" : "Active"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {billing.currentPeriodEnd
                      ? billing.lapsed
                        ? `Expired ${new Date(billing.currentPeriodEnd).toLocaleDateString()} — renew to restore your studio.`
                        : `Active until ${new Date(billing.currentPeriodEnd).toLocaleDateString()}`
                      : "No active period — renew to activate."}
                  </p>
                </div>
                <Button
                  variant={billing.lapsed ? "default" : "outline"}
                  disabled={busy}
                  onClick={renew}
                >
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {billing.lapsed ? "Renew now" : "Renew early"}
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <div className="inline-flex rounded-full border border-border p-1">
                {(["MONTHLY", "YEARLY"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCadence(c)}
                    className={`rounded-full px-5 py-1.5 text-sm font-medium ${
                      cadence === c ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {c === "MONTHLY" ? "Monthly" : "Yearly"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {PLANS.map((p) => {
                const current = billing.plan === p.id && billing.cadence === cadence;
                return (
                  <Card key={p.id} className={p.featured ? "border-primary" : ""}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {p.id === "PREMIUM" && <Crown className="h-5 w-5 text-primary" />}
                        {p.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="font-serif text-3xl font-bold">
                        {GHS(planPrice(p, cadence))}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{cadence === "MONTHLY" ? "mo" : "yr"}
                        </span>
                      </div>
                      <ul className="mt-4 space-y-2">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="mt-6 w-full"
                        variant={current ? "outline" : p.featured ? "default" : "outline"}
                        disabled={current || busy}
                        onClick={() => changeTo(p.id)}
                      >
                        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {current
                          ? "Current plan"
                          : billing.plan === "PREMIUM" && p.id === "STANDARD"
                            ? "Switch to Standard"
                            : `Switch to ${p.name}`}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Switching charges the selected plan once and starts a fresh billing
              period. Plans don't auto-renew — you'll renew each period with
              Mobile Money before it lapses.
            </p>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBilling;
