import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  Loader2,
  Store,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { cartApi, commerceApi, ordersApi, accountApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Cart = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [applyPoints, setApplyPoints] = useState(false);
  const [referral, setReferral] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  const isCustomer = !!user && user.role !== "ADMIN";

  const { data: loyalty } = useQuery({
    queryKey: ["loyalty-points", user?.id],
    queryFn: () => accountApi.getLoyalty(),
    enabled: isCustomer,
  });

  const { data: commerce } = useQuery({
    queryKey: ["commerce-settings"],
    queryFn: () => commerceApi.getSettings(),
  });

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartApi.getMine(),
    enabled: isCustomer,
  });

  // Default the fulfillment method to whatever's enabled (pickup preferred).
  useEffect(() => {
    if (commerce) {
      setFulfillment(commerce.enable_pickup ? "PICKUP" : "DELIVERY");
    }
  }, [commerce]);

  const invalidateCart = () =>
    queryClient.invalidateQueries({ queryKey: ["cart"] });

  const updateMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartApi.updateItem(productId, quantity),
    onSuccess: invalidateCart,
  });
  const removeMutation = useMutation({
    mutationFn: (productId: string) => cartApi.removeItem(productId),
    onSuccess: invalidateCart,
  });

  const onError = (error: unknown) =>
    toast({
      variant: "destructive",
      title: "Something went wrong",
      description: error instanceof Error ? error.message : "Please try again.",
    });

  const handleCheckout = async () => {
    if (fulfillment === "DELIVERY" && (!address.trim() || !phone.trim())) {
      toast({
        variant: "destructive",
        title: "Delivery details needed",
        description: "Enter a delivery address and phone number.",
      });
      return;
    }
    try {
      setRedirecting(true);
      const result = await ordersApi.checkout({
        fulfillment,
        deliveryAddress: fulfillment === "DELIVERY" ? address.trim() : undefined,
        deliveryPhone: fulfillment === "DELIVERY" ? phone.trim() : undefined,
        applyPoints: applyPoints && canUsePoints,
        referralCode: referral.trim() || undefined,
      });
      window.location.href = result.authorization_url;
    } catch (error) {
      setRedirecting(false);
      onError(error);
    }
  };

  // Gates.
  if (!user) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4 text-center max-w-md">
            <ShoppingBag className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
              Log in to view your cart
            </h1>
            <p className="text-muted-foreground mb-6">
              Sign in to add products and check out.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link to="/login?redirect=/cart">Log in</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/shop">Continue shopping</Link>
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (user.role === "ADMIN") {
    return (
      <Layout>
        <section className="py-20 text-center">
          <div className="container mx-auto px-4 max-w-md">
            <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
              Admins can't shop
            </h1>
            <p className="text-muted-foreground mb-6">
              Use a customer account to make purchases.
            </p>
            <Button asChild>
              <Link to="/admin">Back to dashboard</Link>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const deliveryFee =
    fulfillment === "DELIVERY" ? commerce?.delivery_fee ?? 0 : 0;

  // Loyalty: 10 pts = GHS 1, capped at 30% of the subtotal.
  const availablePoints = loyalty?.points ?? 0;
  const maxPointsByCap = Math.floor(subtotal * 0.3 * 10);
  const pointsToUse = Math.min(availablePoints, maxPointsByCap);
  const canUsePoints = availablePoints > 0 && pointsToUse > 0;
  const discount = applyPoints && canUsePoints ? pointsToUse / 10 : 0;

  const total =
    Math.round((subtotal - discount + deliveryFee) * 100) / 100;
  const hasBlockedItem = items.some((i) => !i.in_stock);

  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-6">
            Your Cart
          </h1>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Your cart is empty.</p>
                <Button asChild>
                  <Link to="/shop">Browse products</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <Card key={item.product_id}>
                    <CardContent className="py-4 flex items-center gap-4">
                      <div className="w-16 h-16 rounded bg-secondary overflow-hidden shrink-0">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {item.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          GHS {item.unit_price}
                          {!item.in_stock && (
                            <span className="ml-2 text-destructive">
                              Out of stock
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              updateMutation.mutate({
                                productId: item.product_id,
                                quantity: item.quantity - 1,
                              })
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={
                              item.max_qty !== null &&
                              item.quantity >= item.max_qty
                            }
                            onClick={() =>
                              updateMutation.mutate({
                                productId: item.product_id,
                                quantity: item.quantity + 1,
                              })
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          GHS {item.line_total}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive mt-1"
                          onClick={() => removeMutation.mutate(item.product_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Summary */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="py-5 space-y-4">
                    {/* Fulfillment */}
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">
                        Fulfillment
                      </p>
                      <div className="grid gap-2">
                        {commerce?.enable_pickup && (
                          <button
                            type="button"
                            onClick={() => setFulfillment("PICKUP")}
                            className={cn(
                              "flex items-center gap-2 rounded-md border p-3 text-left text-sm transition-colors",
                              fulfillment === "PICKUP"
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50",
                            )}
                          >
                            <Store className="h-4 w-4 text-primary" />
                            Pickup at studio
                            <span className="ml-auto text-muted-foreground">
                              Free
                            </span>
                          </button>
                        )}
                        {commerce?.enable_delivery && (
                          <button
                            type="button"
                            onClick={() => setFulfillment("DELIVERY")}
                            className={cn(
                              "flex items-center gap-2 rounded-md border p-3 text-left text-sm transition-colors",
                              fulfillment === "DELIVERY"
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50",
                            )}
                          >
                            <Truck className="h-4 w-4 text-primary" />
                            Delivery
                            <span className="ml-auto text-muted-foreground">
                              {commerce.delivery_fee > 0
                                ? `GHS ${commerce.delivery_fee}`
                                : "Free"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {fulfillment === "DELIVERY" && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Delivery address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="min-h-[70px]"
                        />
                        <Input
                          placeholder="Delivery phone number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    )}

                    {/* Loyalty points */}
                    {canUsePoints && (
                      <div className="flex items-start justify-between gap-3 pt-2 border-t border-border">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Use my loyalty points
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Save GHS {pointsToUse / 10} ({pointsToUse} pts) — up
                            to 30% off.
                          </p>
                        </div>
                        <Switch checked={applyPoints} onCheckedChange={setApplyPoints} />
                      </div>
                    )}

                    {/* Referral code */}
                    <div className="space-y-1">
                      <Label htmlFor="ref" className="text-xs text-muted-foreground">
                        Referral code (optional)
                      </Label>
                      <Input
                        id="ref"
                        placeholder="Friend's code"
                        value={referral}
                        onChange={(e) => setReferral(e.target.value)}
                      />
                    </div>

                    {/* Totals */}
                    <div className="space-y-1 pt-2 border-t border-border text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-foreground">GHS {subtotal}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Points discount</span>
                          <span className="text-green-600">− GHS {discount}</span>
                        </div>
                      )}
                      {deliveryFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Delivery</span>
                          <span className="text-foreground">
                            GHS {deliveryFee}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 text-base font-semibold">
                        <span className="text-foreground">Total</span>
                        <span className="text-primary">GHS {total}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      disabled={redirecting || hasBlockedItem}
                      onClick={handleCheckout}
                    >
                      {redirecting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {redirecting ? "Redirecting…" : `Pay GHS ${total}`}
                    </Button>
                    {hasBlockedItem && (
                      <p className="text-xs text-destructive text-center">
                        Remove out-of-stock items to continue.
                      </p>
                    )}
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/shop">Continue shopping</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Cart;
