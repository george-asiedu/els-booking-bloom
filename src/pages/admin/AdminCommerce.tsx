import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShoppingBag, Info } from "lucide-react";
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

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setEnablePickup(settings.enable_pickup);
      setEnableDelivery(settings.enable_delivery);
      setDeliveryFee(settings.delivery_fee);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () =>
      commerceApi.updateSettings({
        enabled,
        enablePickup,
        enableDelivery,
        deliveryFee,
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
          <h1 className="text-2xl font-bold text-foreground">Shop Settings</h1>
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
                      Set to 0 for free delivery.
                    </p>
                  </div>
                )}

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
