import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { planLabel } from "@/config/platform";
import { platformApi, type StudioBillingSummary } from "@/lib/platformApi";
import { formatGHS } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";

const toDateInput = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : "");

/**
 * This customer's own billing terms, set by the super admin: a custom price,
 * a discount, and (without charging them) their plan, period and paid-until
 * date. Every change is recorded in the activity log.
 */
export const StudioBillingTerms = ({ studioId, billing }: { studioId: string; billing: StudioBillingSummary }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const t = billing.terms;
  const initial = () => ({
    customPriceMonthly: t?.customPriceMonthly?.toString() ?? "",
    discountPercent: t?.discountPercent?.toString() ?? "",
    discountEndsAt: toDateInput(t?.discountEndsAt),
    note: t?.note ?? "",
    plan: billing.plan,
    cadence: billing.cadence,
    currentPeriodEnd: toDateInput(billing.currentPeriodEnd),
  });
  const [form, setForm] = useState(initial);
  const store = billing.plan === "STOREFRONT";

  const save = useMutation({
    mutationFn: () =>
      platformApi.updateStudioBilling(studioId, {
        customPriceMonthly: form.customPriceMonthly.trim() ? Number(form.customPriceMonthly) : null,
        discountPercent: form.discountPercent.trim() ? Number(form.discountPercent) : null,
        discountEndsAt: form.discountEndsAt || null,
        note: form.note,
        plan: form.plan,
        cadence: form.cadence,
        ...(form.currentPeriodEnd !== toDateInput(billing.currentPeriodEnd)
          ? { currentPeriodEnd: form.currentPeriodEnd ? `${form.currentPeriodEnd}T23:59:59Z` : null }
          : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform", "studio", studioId] });
      setOpen(false);
      toast({ title: "Billing updated" });
    },
    onError: (e) => toast({ variant: "destructive", title: "Couldn't update billing", description: e instanceof Error ? e.message : "Please try again." }),
  });
  const field = (k: keyof ReturnType<typeof initial>) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value }),
  });
  const price = billing.yourPrice;
  const per = billing.cadence === "YEARLY" ? "year" : "month";

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-base">This customer's price</CardTitle>
        <Button size="sm" variant="outline" onClick={() => { setForm(initial()); setOpen(true); }}>
          <Pencil className="mr-2 h-4 w-4" /> Edit billing
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">Pays per {per}</p>
          <p className="text-xl font-semibold tabular-nums">
            {price ? formatGHS(price.amount) : "—"}
            {price && price.amount !== price.list && <span className="ml-2 text-sm font-normal text-muted-foreground line-through">{formatGHS(price.list)}</span>}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Price</p>
          <p>{t?.customPriceMonthly != null ? `Custom: ${formatGHS(t.customPriceMonthly)}/month` : "Standard list price"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Discount</p>
          <p>
            {t?.discountPercent
              ? `${t.discountPercent}% off${t.discountEndsAt ? ` until ${new Date(t.discountEndsAt).toLocaleDateString("en-GB")}` : ", ongoing"}`
              : "None"}
          </p>
        </div>
        {t?.note && <p className="text-muted-foreground sm:col-span-3">Note: {t.note}</p>}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit billing</DialogTitle>
            <DialogDescription>Changes apply to this customer's next payment. Nothing is charged now.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bt-price">Custom monthly price (GHS)</Label>
              <Input id="bt-price" type="number" min="0" step="any" placeholder="Leave empty for the list price" {...field("customPriceMonthly")} />
              <p className="text-xs text-muted-foreground">Yearly is 10 months of it. Applies while they stay on their current plan.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bt-disc">Discount (%)</Label>
              <Input id="bt-disc" type="number" min="0" max="100" placeholder="e.g. 20" {...field("discountPercent")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bt-disc-end">Discount ends (optional)</Label>
              <Input id="bt-disc-end" type="date" {...field("discountEndsAt")} />
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v as typeof form.plan })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(store ? ["STOREFRONT"] : ["STANDARD", "PREMIUM"]).map((p) => (
                    <SelectItem key={p} value={p}>{planLabel(p as typeof form.plan)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Billing period</Label>
              <Select value={form.cadence} onValueChange={(v) => setForm({ ...form, cadence: v as typeof form.cadence })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bt-end">Paid until</Label>
              <Input id="bt-end" type="date" {...field("currentPeriodEnd")} />
              <p className="text-xs text-muted-foreground">Extend it to give free time, or move it to fix a mistake.</p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bt-note">Note (only you see this)</Label>
              <Textarea id="bt-note" rows={2} {...field("note")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save billing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
