import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CreditCard, Info } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { paymentsApi } from "@/lib/api";
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
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
