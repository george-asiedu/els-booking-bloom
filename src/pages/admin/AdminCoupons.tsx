import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { couponsApi, type CouponInput } from "@/lib/api";
import { formatGHS } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";

const empty: CouponInput = { code: "", type: "PERCENT", value: "", minSubtotal: "", maxUses: "", expiresAt: "" };

/** Discount codes customers can enter in the basket or at checkout. */
const AdminCoupons = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(empty);
  const { data: coupons = [], isLoading } = useQuery({ queryKey: ["admin-coupons"], queryFn: () => couponsApi.list() });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
  const onError = (e: unknown) =>
    toast({ variant: "destructive", title: "Couldn't save the coupon", description: e instanceof Error ? e.message : "Please try again." });
  const create = useMutation({
    mutationFn: () => couponsApi.create(form),
    onSuccess: () => { refresh(); setForm(empty); toast({ title: "Coupon created" }); },
    onError,
  });
  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => couponsApi.setActive(id, active),
    onSuccess: refresh,
    onError,
  });
  const remove = useMutation({ mutationFn: (id: string) => couponsApi.remove(id), onSuccess: refresh, onError });
  const field = (k: keyof CouponInput) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coupons</h1>
          <p className="text-muted-foreground">Create discount codes for your shop. They come off products, not delivery.</p>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">New coupon</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
              <div className="space-y-2"><Label htmlFor="c-code">Code</Label><Input id="c-code" {...field("code")} placeholder="WELCOME10" className="uppercase placeholder:normal-case" required /></div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as CouponInput["type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Percentage off</SelectItem>
                    <SelectItem value="FIXED">Amount off (GHS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="c-value">{form.type === "PERCENT" ? "Percent off" : "Amount off (GHS)"}</Label><Input id="c-value" type="number" min="0" step="any" {...field("value")} required /></div>
              <div className="space-y-2"><Label htmlFor="c-min">Minimum order (GHS, optional)</Label><Input id="c-min" type="number" min="0" {...field("minSubtotal")} /></div>
              <div className="space-y-2"><Label htmlFor="c-max">Total uses allowed (optional)</Label><Input id="c-max" type="number" min="1" {...field("maxUses")} /></div>
              <div className="space-y-2"><Label htmlFor="c-exp">Ends on (optional)</Label><Input id="c-exp" type="date" {...field("expiresAt")} /></div>
              <div className="sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Create coupon
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Your coupons</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            ) : coupons.length === 0 ? (
              <p className="text-sm text-muted-foreground">No coupons yet. Create your first one above.</p>
            ) : (
              <ul className="divide-y divide-border">
                {coupons.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold">{c.code} <Badge variant="outline" className="ml-1 whitespace-nowrap">{c.type === "PERCENT" ? `${c.value}% Off` : `${formatGHS(c.value)} Off`}</Badge></p>
                      <p className="text-xs text-muted-foreground">
                        Used {c.usedCount}{c.maxUses ? ` of ${c.maxUses}` : ""} times
                        {c.minSubtotal > 0 && ` · Min ${formatGHS(c.minSubtotal)}`}
                        {c.expiresAt && ` · Ends ${format(new Date(c.expiresAt), "d MMM yyyy")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={c.active} aria-label={`${c.code} active`} onCheckedChange={(active) => toggle.mutate({ id: c.id, active })} />
                      <Button variant="ghost" size="icon" aria-label={`Delete ${c.code}`} onClick={() => remove.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCoupons;
