import { useEffect, useId, useState } from "react";
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
import { formatGHS } from "@/lib/currency";
import { YEARLY_FREE_MONTHS } from "@/config/platform";

const yearlyFrom = (monthly: number) =>
  Math.round(monthly * (12 - YEARLY_FREE_MONTHS) * 100) / 100;

type Plan = "STANDARD" | "PREMIUM";
type Cadence = "MONTHLY" | "YEARLY";
const PLANS: { id: Plan; name: string }[] = [
  { id: "STANDARD", name: "Standard" },
  { id: "PREMIUM", name: "Premium" },
];

const priceKey = (plan: Plan, cadence: Cadence) =>
  `price${plan === "PREMIUM" ? "Premium" : "Standard"}${cadence === "YEARLY" ? "Yearly" : "Monthly"}` as const;

const PlatformBilling = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["platform-billing-config"],
    queryFn: () => platformApi.getBillingConfig(),
  });

  const [form, setForm] = useState<PlatformBillingConfig | null>(null);
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () => platformApi.updateBillingConfig(form!),
    onSuccess: (saved) => {
      setForm(saved);
      queryClient.invalidateQueries({ queryKey: ["platform-billing-config"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-config"] });
      toast({
        title: "Billing settings saved",
        description: "New signups and renewals use these from now on.",
      });
    },
    onError: (e) =>
      toast({
        variant: "destructive",
        title: "Couldn't save",
        description: e instanceof Error ? e.message : "Please try again.",
      }),
  });

  if (isLoading || !form) {
    return (
      <PlatformLayout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PlatformLayout>
    );
  }

  const num = (v: string) => (v === "" ? 0 : Number(v));
  const set = (patch: Partial<PlatformBillingConfig>) => setForm({ ...form, ...patch });
  const setupFee = (plan: Plan) =>
    plan === "PREMIUM" ? form.subscriptionSetupFeePremium : form.subscriptionSetupFeeStandard;
  const coverMonths = (cadence: Cadence) =>
    cadence === "YEARLY" ? form.setupFeeMonthsYearly : form.setupFeeMonthsMonthly;

  return (
    <PlatformLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <CreditCard className="h-6 w-6 text-primary" />
            Billing settings
          </h1>
          <p className="text-muted-foreground">
            What studios pay you. Changes apply to new signups, renewals and plan changes from
            the moment you save; payments already started keep the price they were started at.
          </p>
        </div>

        {/* Prices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plan prices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-4 gap-y-3">
              <span />
              <span className="text-sm font-medium text-muted-foreground">Per month</span>
              <span className="text-sm font-medium text-muted-foreground">Per year</span>
              {PLANS.map((plan) => (
                <PriceRow key={plan.id} name={plan.name}>
                  <MoneyInput
                    label={`${plan.name} price per month`}
                    value={form[priceKey(plan.id, "MONTHLY")]}
                    // The yearly price follows the monthly one as you type.
                    onChange={(v) =>
                      set({
                        [priceKey(plan.id, "MONTHLY")]: num(v),
                        [priceKey(plan.id, "YEARLY")]: yearlyFrom(num(v)),
                      })
                    }
                  />
                  <p className="text-sm tabular-nums">
                    <span className="font-medium">{formatGHS(form[priceKey(plan.id, "YEARLY")])}</span>
                    <span className="block text-xs text-muted-foreground">
                      {12 - YEARLY_FREE_MONTHS} × monthly
                    </span>
                  </p>
                </PriceRow>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Set the monthly price; the yearly price is always {12 - YEARLY_FREE_MONTHS} months of
              it, so studios paying yearly save {YEARLY_FREE_MONTHS} months as the platform page
              promises. A price must be more than 0.
            </p>
          </CardContent>
        </Card>

        {/* Setup fee */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Setup fee</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              New studios pay this at signup instead of their first month or year. Set a plan's
              fee to 0 to turn it off for that plan.
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              {PLANS.map((plan) => (
                <Field
                  key={plan.id}
                  label={`${plan.name} setup fee`}
                  value={setupFee(plan.id)}
                  onChange={(v) =>
                    set(
                      plan.id === "PREMIUM"
                        ? { subscriptionSetupFeePremium: num(v) }
                        : { subscriptionSetupFeeStandard: num(v) },
                    )
                  }
                  suffix="GHS"
                />
              ))}
            </div>

            <div className="space-y-3 border-t pt-5">
              <div>
                <p className="font-medium">How long the setup fee covers</p>
                <p className="text-sm text-muted-foreground">
                  This depends on how a studio chooses to pay, not on which plan it picks. It's
                  the same for Standard and Premium.
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  label="Studios paying monthly"
                  value={form.setupFeeMonthsMonthly}
                  onChange={(v) => set({ setupFeeMonthsMonthly: num(v) })}
                  suffix="months"
                  min={1}
                  max={24}
                />
                <Field
                  label="Studios paying yearly"
                  value={form.setupFeeMonthsYearly}
                  onChange={(v) => set({ setupFeeMonthsYearly: num(v) })}
                  suffix="months"
                  min={1}
                  max={24}
                />
              </div>
            </div>

            {/* What a new studio will be asked to pay, so a typo is obvious
                before it's saved. */}
            <div className="rounded-md border bg-muted/40 p-4 text-sm">
              <p className="mb-2 font-medium">What new studios will see</p>
              <ul className="space-y-1.5 text-muted-foreground">
                {PLANS.flatMap((plan) =>
                  (["MONTHLY", "YEARLY"] as const).map((cadence) => {
                    const fee = setupFee(plan.id);
                    const price = form[priceKey(plan.id, cadence)];
                    const then = `${formatGHS(price)}/${cadence === "YEARLY" ? "year" : "month"}`;
                    return (
                      <li key={plan.id + cadence}>
                        <span className="font-medium text-foreground">
                          {plan.name}, paying {cadence === "YEARLY" ? "yearly" : "monthly"}:
                        </span>{" "}
                        {fee > 0
                          ? `${formatGHS(fee)} at signup, covering the first ${coverMonths(cadence)} months, then ${then}.`
                          : `No setup fee. ${then} from signup.`}
                      </li>
                    );
                  }),
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Revenue share */}
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-5">
            <div>
              <p className="font-medium">Offer revenue-share at signup</p>
              <p className="text-sm text-muted-foreground">
                When on, new studios can choose to pay a per-transaction commission instead of a
                recurring plan fee. When off, only subscription is shown.
              </p>
            </div>
            <Switch
              checked={form.revenueShareEnabled}
              onCheckedChange={(v) => set({ revenueShareEnabled: v })}
              aria-label="Offer revenue-share at signup"
            />
          </CardContent>
        </Card>

        <Card className={form.revenueShareEnabled ? "" : "opacity-60"}>
          <CardHeader>
            <CardTitle className="text-lg">Revenue-share rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              The plan a studio picks sets its commission and one-time activation fee. This is
              separate from the setup fee above.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <p className="font-semibold">Standard</p>
                <Field
                  label="Commission per transaction"
                  value={form.commissionStandardPercent}
                  onChange={(v) => set({ commissionStandardPercent: num(v) })}
                  suffix="%"
                  max={100}
                />
                <Field
                  label="One-time activation fee"
                  value={form.setupFeeStandard}
                  onChange={(v) => set({ setupFeeStandard: num(v) })}
                  suffix="GHS"
                />
              </div>
              <div className="space-y-4">
                <p className="font-semibold">Premium</p>
                <Field
                  label="Commission per transaction"
                  value={form.commissionPremiumPercent}
                  onChange={(v) => set({ commissionPremiumPercent: num(v) })}
                  suffix="%"
                  max={100}
                />
                <Field
                  label="One-time activation fee"
                  value={form.setupFeePremium}
                  onChange={(v) => set({ setupFeePremium: num(v) })}
                  suffix="GHS"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              An activation fee of 0 means revenue-share studios are created immediately with no
              upfront charge. Existing studios keep the rate they onboarded with.
            </p>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending} size="lg" className="shadow-lg">
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save billing settings
          </Button>
        </div>
      </div>
    </PlatformLayout>
  );
};

const PriceRow = ({ name, children }: { name: string; children: React.ReactNode }) => (
  <>
    <span className="font-medium">{name}</span>
    {children}
  </>
);

const MoneyInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
}) => (
  <div className="flex items-center gap-2">
    <span className="text-sm text-muted-foreground">GHS</span>
    <Input
      type="number"
      min={1}
      step="any"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="max-w-[140px] tabular-nums"
    />
  </div>
);

const Field = ({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
  suffix?: string;
  min?: number;
  max?: number;
}) => {
  const id = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex max-w-[220px] items-center gap-2">
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="tabular-nums"
        />
        {suffix && <span className="text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
};

export default PlatformBilling;
