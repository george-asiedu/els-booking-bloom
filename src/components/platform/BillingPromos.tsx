import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { planLabel } from "@/config/platform";
import { platformApi } from "@/lib/platformApi";
import { useToast } from "@/hooks/use-toast";

const PLANS = ["STANDARD", "PREMIUM", "STOREFRONT"] as const;

/** Promo codes owners enter at signup, renewal or a plan change for % off. */
export const BillingPromos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ code: "", percentOff: "", maxUses: "", expiresAt: "", plans: [] as string[] });
  const { data: promos = [], isLoading } = useQuery({ queryKey: ["billing-promos"], queryFn: () => platformApi.listBillingPromos() });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["billing-promos"] });
  const onError = (e: unknown) => toast({ variant: "destructive", title: "Couldn't save the promo", description: e instanceof Error ? e.message : "Please try again." });
  const create = useMutation({
    mutationFn: () =>
      platformApi.createBillingPromo({
        code: form.code,
        percentOff: Number(form.percentOff),
        plans: form.plans,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt ? `${form.expiresAt}T23:59:59Z` : null,
      }),
    onSuccess: () => { refresh(); setForm({ code: "", percentOff: "", maxUses: "", expiresAt: "", plans: [] }); toast({ title: "Promo created" }); },
    onError,
  });
  const toggle = useMutation({ mutationFn: ({ id, active }: { id: string; active: boolean }) => platformApi.setBillingPromoActive(id, active), onSuccess: refresh, onError });
  const remove = useMutation({ mutationFn: (id: string) => platformApi.deleteBillingPromo(id), onSuccess: refresh, onError });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Billing promos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Percentage off what studio and store owners pay: at signup, renewal or a plan change. To give one customer a lasting deal, set it on their page instead.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <div className="space-y-2"><Label htmlFor="bp-code">Code</Label><Input id="bp-code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="LAUNCH30" className="uppercase placeholder:normal-case" /></div>
          <div className="space-y-2"><Label htmlFor="bp-pct">% off</Label><Input id="bp-pct" required type="number" min="1" max="100" value={form.percentOff} onChange={(e) => setForm({ ...form, percentOff: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="bp-max">Total uses (optional)</Label><Input id="bp-max" type="number" min="1" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="bp-exp">Ends (optional)</Label><Input id="bp-exp" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div>
          <fieldset className="sm:col-span-2 lg:col-span-4">
            <legend className="mb-2 text-sm font-medium">Plans (none ticked = every plan)</legend>
            <div className="flex flex-wrap gap-4">
              {PLANS.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={form.plans.includes(p)} onCheckedChange={(on) => setForm({ ...form, plans: on ? [...form.plans, p] : form.plans.filter((x) => x !== p) })} />
                  {planLabel(p)}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create promo
            </Button>
          </div>
        </form>

        {isLoading ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        ) : promos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No promos yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {promos.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {p.code} <Badge variant="outline" className="ml-1 whitespace-nowrap">{p.percentOff}% Off</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.plans.length ? p.plans.map((x) => planLabel(x as (typeof PLANS)[number])).join(", ") : "All plans"}
                    {` · Used ${p.usedCount}${p.maxUses ? ` of ${p.maxUses}` : ""}`}
                    {p.expiresAt && ` · Ends ${format(new Date(p.expiresAt), "d MMM yyyy")}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={p.active} aria-label={`${p.code} active`} onCheckedChange={(active) => toggle.mutate({ id: p.id, active })} />
                  <Button variant="ghost" size="icon" aria-label={`Delete ${p.code}`} onClick={() => remove.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
