import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CreditCard, Info, Wallet, CheckCircle2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paymentsApi, studioAdminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const AdminPayments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: () => paymentsApi.getSettings(),
  });

  const [enabled, setEnabled] = useState(false);
  const [allowFull, setAllowFull] = useState(true);
  const [allowPartial, setAllowPartial] = useState(false);
  const [depositPercent, setDepositPercent] = useState(50);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setAllowFull(settings.allow_full);
      setAllowPartial(settings.allow_partial);
      setDepositPercent(settings.deposit_percent);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () =>
      paymentsApi.updateSettings({
        enabled,
        allowFull,
        allowPartial,
        depositPercent,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
      toast({
        title: "Payment settings saved",
        description: "Your payment policy has been updated.",
      });
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Couldn't save settings",
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  // ---- Payout account (Paystack subaccount, mobile money) ----
  const { data: payout } = useQuery({
    queryKey: ["studio-payout"],
    queryFn: () => studioAdminApi.getPayout(),
  });
  const [payProvider, setPayProvider] = useState("");
  const [payNumber, setPayNumber] = useState("");
  const [payName, setPayName] = useState("");
  const [resolving, setResolving] = useState(false);

  // Auto-verify once a full (10-digit) number is entered.
  useEffect(() => {
    const digits = payNumber.replace(/\D/g, "");
    if (!payProvider || digits.length < 10 || payName || resolving) return;
    const t = setTimeout(() => resolveName(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payNumber, payProvider]);

  // Verify the number with Paystack and auto-fill the registered account name.
  const resolveName = async () => {
    if (!payProvider || !/^\d{9,15}$/.test(payNumber.trim())) return;
    setResolving(true);
    try {
      const name = await studioAdminApi.resolvePayoutName(
        payNumber.trim(),
        payProvider,
      );
      setPayName(name);
    } catch (error) {
      setPayName("");
      toast({
        variant: "destructive",
        title: "Couldn't verify that number",
        description:
          error instanceof Error
            ? error.message
            : "Check the number and provider and try again.",
      });
    } finally {
      setResolving(false);
    }
  };
  useEffect(() => {
    if (payout) {
      setPayProvider(payout.provider ?? "");
      setPayNumber(payout.accountNumber ?? "");
      setPayName(payout.accountName ?? "");
    }
  }, [payout]);

  const payoutMutation = useMutation({
    mutationFn: () =>
      studioAdminApi.updatePayout({
        provider: payProvider,
        accountNumber: payNumber,
        accountName: payName,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-payout"] });
      toast({
        title: "Payout account saved",
        description: "Payments will settle to this mobile-money account.",
      });
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Couldn't save payout account",
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  // ---- Loyalty redemption cap ----
  const { data: loyalty } = useQuery({
    queryKey: ["studio-loyalty"],
    queryFn: () => studioAdminApi.getLoyalty(),
  });
  const [loyaltyCap, setLoyaltyCap] = useState(30);
  useEffect(() => {
    if (loyalty) setLoyaltyCap(loyalty.loyaltyCapPercent);
  }, [loyalty]);
  const loyaltyMutation = useMutation({
    mutationFn: () => studioAdminApi.updateLoyalty(loyaltyCap),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-loyalty"] });
      queryClient.invalidateQueries({ queryKey: ["studio-config"] });
      toast({
        title: "Loyalty cap saved",
        description: `Customers can pay up to ${loyaltyCap}% of a booking with points.`,
      });
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Couldn't save",
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  // Guard: when payments are on, at least one method must be available.
  const noMethod = enabled && !allowFull && !allowPartial;
  const invalidDeposit =
    allowPartial && (depositPercent < 1 || depositPercent > 100);

  const handleSave = () => {
    if (noMethod) {
      toast({
        variant: "destructive",
        title: "Choose a payment method",
        description: "Enable full payment, deposit, or both.",
      });
      return;
    }
    if (invalidDeposit) {
      toast({
        variant: "destructive",
        title: "Invalid deposit",
        description: "Deposit percentage must be between 1 and 100.",
      });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground">
            Control how customers pay when booking an appointment.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Require payment at booking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">
                      Online payment {enabled ? "on" : "off"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      When on, customers pay via Paystack to complete a booking.
                      When off, bookings are created as “payment pending” (pay at
                      the studio).
                    </p>
                  </div>
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>
              </CardContent>
            </Card>

            <Card className={enabled ? "" : "opacity-60 pointer-events-none"}>
              <CardHeader>
                <CardTitle className="text-lg">Payment options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">
                      Allow full payment
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Customer pays the full amount due upfront.
                    </p>
                  </div>
                  <Switch checked={allowFull} onCheckedChange={setAllowFull} />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">
                      Allow partial payment (deposit)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Customer pays a deposit now; the balance is paid at the
                      studio.
                    </p>
                  </div>
                  <Switch
                    checked={allowPartial}
                    onCheckedChange={setAllowPartial}
                  />
                </div>

                {allowPartial && (
                  <div className="space-y-2">
                    <Label htmlFor="deposit">Deposit percentage</Label>
                    <div className="flex items-center gap-2 max-w-[160px]">
                      <Input
                        id="deposit"
                        type="number"
                        min={1}
                        max={100}
                        value={depositPercent}
                        onChange={(e) =>
                          setDepositPercent(Number(e.target.value))
                        }
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      e.g. 50% of a GHS 200 service means a GHS 100 deposit.
                    </p>
                  </div>
                )}

                {noMethod && (
                  <p className="flex items-center gap-2 text-sm text-destructive">
                    <Info className="h-4 w-4" />
                    Enable at least one payment method.
                  </p>
                )}
              </CardContent>
            </Card>

            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              size="lg"
            >
              {saveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Settings
            </Button>

            {/* Payout account — where your money settles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wallet className="h-5 w-5 text-primary" />
                  Payout account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect a mobile-money account so customer payments settle to
                  you automatically.
                  {payout && payout.platformFeePercent > 0 && (
                    <> A platform fee of {payout.platformFeePercent}% applies.</>
                  )}
                </p>

                {payout?.connected && (
                  <p className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Connected — payments settle to your account.
                  </p>
                )}

                <div className="space-y-2">
                  <Label>Mobile-money provider</Label>
                  <Select
                    value={payProvider}
                    onValueChange={(v) => {
                      setPayProvider(v);
                      setPayName("");
                    }}
                  >
                    <SelectTrigger className="max-w-sm">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {(payout?.providers ?? []).map((p) => (
                        <SelectItem key={p.code} value={p.code}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payout-number">Mobile-money number</Label>
                  <div className="relative max-w-sm">
                    <Input
                      id="payout-number"
                      value={payNumber}
                      onChange={(e) => {
                        setPayNumber(e.target.value);
                        setPayName("");
                      }}
                      onBlur={resolveName}
                      inputMode="numeric"
                      placeholder="0244123456"
                    />
                    {resolving && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll verify the number and fetch the account name.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payout-name">Account name</Label>
                  <div className="relative max-w-sm">
                    <Input
                      id="payout-name"
                      value={payName}
                      readOnly
                      placeholder={
                        resolving ? "Verifying…" : "Auto-filled after verifying"
                      }
                      className="bg-muted/50"
                    />
                    {resolving && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => payoutMutation.mutate()}
                  disabled={
                    payoutMutation.isPending ||
                    resolving ||
                    !payProvider ||
                    !payNumber ||
                    !payName
                  }
                >
                  {payoutMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {payout?.connected ? "Update payout account" : "Connect account"}
                </Button>
              </CardContent>
            </Card>

            {/* Loyalty redemption cap */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Loyalty redemption</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The most of a booking a customer can pay for with loyalty
                  points.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="loyalty-cap">Maximum discount from points</Label>
                  <div className="flex items-center gap-2 max-w-[160px]">
                    <Input
                      id="loyalty-cap"
                      type="number"
                      min={0}
                      max={100}
                      value={loyaltyCap}
                      onChange={(e) => setLoyaltyCap(Number(e.target.value))}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
                <Button
                  onClick={() => loyaltyMutation.mutate()}
                  disabled={
                    loyaltyMutation.isPending ||
                    loyaltyCap < 0 ||
                    loyaltyCap > 100
                  }
                >
                  {loyaltyMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save loyalty cap
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
