import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { platformApi, PlatformBillingConfig } from "@/lib/platformApi";
import { PlatformLayout } from "./PlatformLayout";
import { useToast } from "@/hooks/use-toast";

const PlatformBilling = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["platform-billing-config"],
    queryFn: () => platformApi.getBillingConfig(),
  });

  const [form, setForm] = useState<PlatformBillingConfig>({
    revenueShareEnabled: false,
    commissionStandardPercent: 5,
    commissionPremiumPercent: 8,
    setupFeeStandard: 0,
    setupFeePremium: 0,
  });
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () => platformApi.updateBillingConfig(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-billing-config"] });
      toast({ title: "Billing settings saved" });
    },
    onError: (e) =>
      toast({
        variant: "destructive",
        title: "Couldn't save",
        description: e instanceof Error ? e.message : "Please try again.",
      }),
  });

  const num = (v: string) => (v === "" ? 0 : Number(v));

  if (isLoading) {
    return (
      <PlatformLayout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <CreditCard className="h-6 w-6 text-primary" />
          Billing settings
        </h1>
        <p className="text-muted-foreground">
          Control how studios are billed. Plan subscriptions are always offered;
          revenue-share (a per-transaction cut) is optional.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between gap-4 py-5">
          <div>
            <p className="font-medium">Offer revenue-share at signup</p>
            <p className="text-sm text-muted-foreground">
              When on, new studios can choose to pay a per-transaction commission
              instead of a recurring plan fee. When off, only subscription is shown.
            </p>
          </div>
          <Switch
            checked={form.revenueShareEnabled}
            onCheckedChange={(v) => setForm({ ...form, revenueShareEnabled: v })}
          />
        </CardContent>
      </Card>

      <Card className={form.revenueShareEnabled ? "" : "opacity-60"}>
        <CardHeader>
          <CardTitle className="text-lg">Revenue-share rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            The plan a studio picks sets its commission and one-time setup fee.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              <p className="font-semibold">Standard</p>
              <Field
                label="Commission per transaction (%)"
                value={form.commissionStandardPercent}
                onChange={(v) =>
                  setForm({ ...form, commissionStandardPercent: num(v) })
                }
                suffix="%"
                max={100}
              />
              <Field
                label="One-time setup fee (GHS)"
                value={form.setupFeeStandard}
                onChange={(v) => setForm({ ...form, setupFeeStandard: num(v) })}
                suffix="₵"
              />
            </div>
            <div className="space-y-4">
              <p className="font-semibold">Premium</p>
              <Field
                label="Commission per transaction (%)"
                value={form.commissionPremiumPercent}
                onChange={(v) =>
                  setForm({ ...form, commissionPremiumPercent: num(v) })
                }
                suffix="%"
                max={100}
              />
              <Field
                label="One-time setup fee (GHS)"
                value={form.setupFeePremium}
                onChange={(v) => setForm({ ...form, setupFeePremium: num(v) })}
                suffix="₵"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            A setup fee of 0 means revenue-share studios are created immediately
            with no upfront charge. Changing rates affects new signups; existing
            studios keep the rate they onboarded with.
          </p>
        </CardContent>
      </Card>

      <Button onClick={() => save.mutate()} disabled={save.isPending} size="lg">
        {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save billing settings
      </Button>
    </div>
    </PlatformLayout>
  );
};

const Field = ({
  label,
  value,
  onChange,
  suffix,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
  suffix?: string;
  max?: number;
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <div className="flex items-center gap-2 max-w-[200px]">
      <Input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {suffix && <span className="text-muted-foreground">{suffix}</span>}
    </div>
  </div>
);

export default PlatformBilling;
