import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShoppingBag, Info, Plus, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { commerceApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const AdminCommerce = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["commerce-settings"],
    queryFn: () => commerceApi.getSettings(),
  });

  const [enabled, setEnabled] = useState(true);
  const [enablePickup, setEnablePickup] = useState(true);
  const [enableDelivery, setEnableDelivery] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [lowStock, setLowStock] = useState(3);
  const [zones, setZones] = useState<{ id?: string; name: string; fee: string }[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [newSlot, setNewSlot] = useState("");

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setEnablePickup(settings.enable_pickup);
      setEnableDelivery(settings.enable_delivery);
      setDeliveryFee(settings.delivery_fee);
      setLowStock(settings.low_stock_threshold);
      setZones(settings.delivery_zones.map((z) => ({ id: z.id, name: z.name, fee: String(z.fee) })));
      setSlots(settings.delivery_slots);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () =>
      commerceApi.updateSettings({
        enabled,
        enablePickup,
        enableDelivery,
        deliveryFee,
        lowStockThreshold: lowStock,
        deliveryZones: zones.filter((z) => z.name.trim()).map((z) => ({ ...(z.id ? { id: z.id } : {}), name: z.name.trim(), fee: Number(z.fee) || 0 })),
        deliverySlots: slots,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commerce-settings"] });
      toast({ title: "Shop settings saved" });
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Couldn't save settings",
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const noFulfillment = enabled && !enablePickup && !enableDelivery;

  const handleSave = () => {
    if (noFulfillment) {
      toast({
        variant: "destructive",
        title: "Choose a fulfillment method",
        description: "Enable pickup, delivery, or both.",
      });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shop settings</h1>
          <p className="text-muted-foreground">
            Control your product shop and how orders are fulfilled.
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
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Shop visibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">
                      Shop {enabled ? "open" : "closed"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      When open, customers can browse products and check out.
                      When closed, the Shop is hidden from the site.
                    </p>
                  </div>
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>
              </CardContent>
            </Card>

            <Card className={enabled ? "" : "opacity-60 pointer-events-none"}>
              <CardHeader>
                <CardTitle className="text-lg">Fulfillment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">Pickup at studio</p>
                    <p className="text-sm text-muted-foreground">
                      Customer collects the order at the studio (free).
                    </p>
                  </div>
                  <Switch
                    checked={enablePickup}
                    onCheckedChange={setEnablePickup}
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      Customer provides an address; a delivery fee is added.
                    </p>
                  </div>
                  <Switch
                    checked={enableDelivery}
                    onCheckedChange={setEnableDelivery}
                  />
                </div>

                {enableDelivery && (
                  <div className="space-y-2">
                    <Label htmlFor="fee">Delivery fee (GHS)</Label>
                    <Input
                      id="fee"
                      type="number"
                      min={0}
                      step="0.01"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Number(e.target.value))}
                      className="max-w-[160px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      {zones.length ? "Not used while you have delivery areas below." : "Set to 0 for free delivery."}
                    </p>
                  </div>
                )}

                {enableDelivery && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <div>
                      <p className="font-medium text-foreground">Delivery areas</p>
                      <p className="text-sm text-muted-foreground">
                        Charge by distance: customers pick their area at checkout and pay its fee. Leave empty to use the one fee above.
                      </p>
                    </div>
                    {zones.map((z, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input aria-label="Area name" placeholder="e.g. East Legon" value={z.name} maxLength={60} onChange={(e) => setZones(zones.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                        <Input aria-label="Fee in GHS" type="number" min={0} step="0.01" placeholder="Fee" value={z.fee} onChange={(e) => setZones(zones.map((x, j) => (j === i ? { ...x, fee: e.target.value } : x)))} className="w-28" />
                        <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${z.name || "area"}`} onClick={() => setZones(zones.filter((_, j) => j !== i))}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => setZones([...zones, { name: "", fee: "" }])} disabled={zones.length >= 30}>
                      <Plus className="mr-2 h-4 w-4" /> Add area
                    </Button>
                  </div>
                )}

                {enableDelivery && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <div>
                      <p className="font-medium text-foreground">Delivery times</p>
                      <p className="text-sm text-muted-foreground">
                        Customers choose a day and one of these windows, so your rider knows when to go. Leave empty to deliver whenever you can.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((w) => (
                        <span key={w} className="flex items-center gap-1 rounded-full border border-border py-1 pl-3 pr-1 text-sm">
                          {w}
                          <button type="button" className="rounded-full p-1 hover:bg-accent" aria-label={`Remove ${w}`} onClick={() => setSlots(slots.filter((x) => x !== w))}>
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const w = newSlot.trim();
                        if (w && !slots.includes(w) && slots.length < 8) setSlots([...slots, w]);
                        setNewSlot("");
                      }}
                    >
                      <Input aria-label="New delivery time" placeholder="e.g. Morning (9am–12pm)" maxLength={40} value={newSlot} onChange={(e) => setNewSlot(e.target.value)} className="max-w-xs" />
                      <Button type="submit" variant="outline" size="sm" disabled={!newSlot.trim() || slots.length >= 8}>Add</Button>
                    </form>
                    {!slots.length && (
                      <button type="button" className="text-sm text-muted-foreground underline underline-offset-2" onClick={() => setSlots(["Morning (9am–12pm)", "Afternoon (12–4pm)", "Evening (4–7pm)"])}>
                        Use morning, afternoon and evening
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-2 border-t border-border pt-4">
                  <Label htmlFor="low-stock">Tell me when stock falls to</Label>
                  <Input
                    id="low-stock"
                    type="number"
                    min={0}
                    max={1000}
                    value={lowStock}
                    onChange={(e) => setLowStock(Number(e.target.value))}
                    className="max-w-[160px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    You'll get a notification when a sale leaves a product at this many or fewer, and when it sells out.
                  </p>
                </div>

                {noFulfillment && (
                  <p className="flex items-center gap-2 text-sm text-destructive">
                    <Info className="h-4 w-4" />
                    Enable at least one fulfillment method.
                  </p>
                )}
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={saveMutation.isPending} size="lg">
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

export default AdminCommerce;
