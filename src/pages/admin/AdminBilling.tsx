import { InviteBusinessCard } from "@/components/admin/InviteBusinessCard";
import { useState } from "react";
import { PROCESSING, useProcessing } from "@/components/ProcessingOverlay";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PaystackPop from "@paystack/inline-js";
import { Loader2, CreditCard, Check, Crown } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { studioBillingApi, type RenewalReceiptDTO } from "@/lib/api";
import { RenewalSuccessDialog } from "@/components/admin/RenewalSuccessDialog";
import { celebrate } from "@/lib/confetti";
import { PLANS, planPrice, productOf, planLabel } from "@/config/platform";
import { useToast } from "@/hooks/use-toast";
import { formatGHS } from "@/lib/currency";

const GHS = formatGHS;

const AdminBilling = () => {
  const [promoCode, setPromoCode] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const processing = useProcessing();
  const [cadence, setCadence] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [busy, setBusy] = useState(false);
  const [renewed, setRenewed] = useState<{ receipt: RenewalReceiptDTO; wasLapsed: boolean } | null>(null);

  const { data: billing, isLoading } = useQuery({
    queryKey: ["studio-billing"],
    queryFn: () => studioBillingApi.get(),
  });

  const revShare = billing?.billingMode === "REVENUE_SHARE";

  const changeTo = async (plan: "STANDARD" | "PREMIUM" | "STOREFRONT") => {
    if (billing && !revShare && billing.plan === plan && billing.cadence === cadence) {
      toast({ title: "You're already on this plan." });
      return;
    }
    setBusy(true);
    processing.show(PROCESSING.preparing);
    try {
      const { reference, accessCode } = await studioBillingApi.startChange({
        plan,
        cadence,
        promoCode: promoCode.trim() || undefined,
      });
      processing.hide();
      const popup = new PaystackPop();
      popup.resumeTransaction(accessCode, {
        onSuccess: async () => {
          try {
            processing.show({
              title: "Updating your plan",
              message: "Your payment went through. We're applying it to your plan now.",
            });
            await studioBillingApi.applyChange({ reference, plan, cadence });
            queryClient.invalidateQueries({ queryKey: ["studio-billing"] });
            queryClient.invalidateQueries({ queryKey: ["studio-config"] });
            celebrate();
            toast({
              title: "Plan updated",
              description: `You're now on ${planLabel(plan)}.`,
            });
          } catch (err) {
            toast({
              variant: "destructive",
              title: "Payment received, but the switch didn't apply",
              description: err instanceof Error ? err.message : "Please contact support.",
            });
          } finally {
            processing.hide();
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
      processing.hide();
      setBusy(false);
      toast({
        variant: "destructive",
        title: "Couldn't start the change",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  // Settle the extras now (feature fees, storage, training) without renewing.
  const payExtras = async () => {
    setBusy(true);
    processing.show(PROCESSING.preparing);
    try {
      const { reference, accessCode } = await studioBillingApi.startExtrasPayment();
      processing.hide();
      const popup = new PaystackPop();
      popup.resumeTransaction(accessCode, {
        onSuccess: async () => {
          try {
            processing.show({ title: "Recording your payment", message: "Your payment went through. We're applying it now." });
            await studioBillingApi.applyExtrasPayment({ reference });
            queryClient.invalidateQueries({ queryKey: ["studio-billing"] });
            toast({ title: "Paid", description: "Your extra charges are settled." });
          } catch (err) {
            toast({ variant: "destructive", title: "Payment received, but it didn't apply", description: err instanceof Error ? err.message : "Please contact support." });
          } finally {
            processing.hide();
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
      processing.hide();
      setBusy(false);
      toast({ variant: "destructive", title: "Couldn't start the payment", description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  const renew = async () => {
    setBusy(true);
    processing.show(PROCESSING.preparing);
    try {
      const { reference, accessCode } = await studioBillingApi.startRenewal(promoCode.trim() || undefined);
      processing.hide();
      const popup = new PaystackPop();
      popup.resumeTransaction(accessCode, {
        onSuccess: async () => {
          try {
            processing.show({
              title: "Updating your plan",
              message: "Your payment went through. We're applying it to your plan now.",
            });
            const wasLapsed = Boolean(billing?.lapsed);
            const updated = await studioBillingApi.applyRenewal({ reference });
            queryClient.invalidateQueries({ queryKey: ["studio-billing"] });
            queryClient.invalidateQueries({ queryKey: ["studio-config"] });
            if (updated.renewal) {
              setRenewed({
                receipt: updated.renewal,
                // The server knows when it applied the payment itself; if the
                // webhook got there first, go by what this page showed.
                wasLapsed: updated.renewal.wasLapsed ?? wasLapsed,
              });
            } else {
              toast({
                title: "Renewed",
                description: "Your plan has been extended for another period.",
              });
            }
          } catch (err) {
            toast({
              variant: "destructive",
              title: "Payment received, but the renewal didn't apply",
              description: err instanceof Error ? err.message : "Please contact support.",
            });
          } finally {
            processing.hide();
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
      processing.hide();
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
        ) : (
          <>
            {!!billing.extras?.items.length && (
              <Card>
                <CardContent className="py-4 text-sm">
                  <p className="font-medium">{revShare ? "Extra charges" : "Added to your next renewal"}</p>
                  <ul className="mt-1 space-y-0.5">
                    {billing.extras.items.map((x) => (
                      <li key={x.id} className="flex justify-between gap-4">
                        <span className="text-muted-foreground">{x.description}</span>
                        <span className="tabular-nums">{GHS(x.amount)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 flex justify-between gap-4 border-t border-border pt-1 font-medium">
                    <span>Extras total</span>
                    <span className="tabular-nums">{GHS(billing.extras.total)}</span>
                  </p>
                  <Button size="sm" variant={revShare ? "default" : "outline"} className="mt-2" disabled={busy} onClick={payExtras}>
                    Pay {GHS(billing.extras.total)} now
                  </Button>
                </CardContent>
              </Card>
            )}
            {revShare ? (
          <Card>
            <CardContent className="space-y-3 py-6">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Current plan</span>
                <Badge variant={billing.plan === "PREMIUM" ? "default" : "secondary"}>
                  {planLabel(billing.plan)}
                </Badge>
                <Badge variant="outline">Pay as you earn</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your account bills per transaction — the platform takes{" "}
                <span className="font-semibold text-foreground">
                  {billing.commissionPercent}%
                </span>{" "}
                of each customer payment. There's no recurring plan fee and nothing
                to renew. Prefer a fixed monthly or yearly fee instead? Pick a plan
                below to switch — the commission stops as soon as you do.
              </p>
            </CardContent>
          </Card>
            ) : (
            <Card className={billing.lapsed ? "border-destructive" : ""}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Current plan</span>
                    <Badge variant={billing.plan === "PREMIUM" ? "default" : "secondary"}>
                      {planLabel(billing.plan)}
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
            )}

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

            {(billing.discountPercent ?? 0) > 0 && (
              <p className="rounded-lg bg-primary/10 p-3 text-center text-sm">
                Your account has {billing.discountPercent}% off
                {billing.discountEndsAt ? ` until ${new Date(billing.discountEndsAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}` : ""}. Prices below include it.
              </p>
            )}
            <div className="mx-auto flex max-w-sm items-center gap-2">
              <Input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Promo code (optional)"
                aria-label="Promo code"
                className="uppercase placeholder:normal-case"
              />
            </div>
            <p className="-mt-2 text-center text-xs text-muted-foreground">
              A promo code applies to your next payment, a renewal or a plan change. It doesn't add to your own discount; the bigger one is used.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Only plans from this account's product: a storefront sees
                  Storefront, a studio sees Standard and Premium. */}
              {PLANS.filter((p) => p.product === productOf(billing.plan)).map((p) => {
                const current = !revShare && billing.plan === p.id && billing.cadence === cadence;
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
                        {GHS(billing.yourPrices?.[p.id]?.[cadence] ?? planPrice(p, cadence))}
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
                          : revShare
                            ? `Switch to ${p.name} (${cadence === "MONTHLY" ? "monthly" : "yearly"})`
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
              {revShare
                ? "Switching charges the selected plan once, ends the per-transaction commission, and starts a recurring billing period. This can't be undone from your dashboard. "
                : "Switching charges the selected plan once and starts a fresh billing period. "}
              Plans don't auto-renew — you'll renew each period with Mobile Money
              before it lapses.
            </p>
          </>
        )}
        <InviteBusinessCard />
      </div>
      <RenewalSuccessDialog
        receipt={renewed?.receipt ?? null}
        wasLapsed={renewed?.wasLapsed ?? false}
        onClose={() => setRenewed(null)}
      />
    </AdminLayout>
  );
};

export default AdminBilling;
