import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  Loader2,
  Store,
  Truck,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/layout/Layout";
import { StudioPageHero } from "@/components/storefront/StudioPageHero";
import { cn } from "@/lib/utils";
import { cartApi, commerceApi, ordersApi, accountApi, PaymentTarget } from "@/lib/api";
import { PaymentDialog } from "@/components/payment/PaymentDialog";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/hooks/useStudio";
import { useToast } from "@/hooks/use-toast";

const GHS = (n: number) => `GH₵ ${n.toLocaleString()}`;

const Cart = () => {
  const { user } = useAuth();
  const { config: studioConfig } = useStudio();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [applyPoints, setApplyPoints] = useState(false);
  const [referral, setReferral] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();
  const [paymentTarget, setPaymentTarget] = useState<PaymentTarget | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

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

  useEffect(() => {
    if (commerce) setFulfillment(commerce.enable_pickup ? "PICKUP" : "DELIVERY");
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
    onSuccess: () => {
      invalidateCart();
      toast({ title: "Removed", description: "Item removed from your bag." });
    },
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
      setRedirecting(false);
      setPaymentTarget({
        reference: result.reference,
        amount: result.total,
        email: result.email,
        access_code: result.access_code,
        subaccount: result.subaccount,
        public_key: result.public_key,
      });
      setPaymentOpen(true);
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
          <div className="container mx-auto max-w-md px-4 text-center">
            <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">
              Log in to view your bag
            </h1>
            <p className="mb-6 text-muted-foreground">
              Sign in to add products and check out.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
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
          <div className="container mx-auto max-w-md px-4">
            <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">
              Admins can't shop
            </h1>
            <p className="mb-6 text-muted-foreground">
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
  const deliveryFee = fulfillment === "DELIVERY" ? commerce?.delivery_fee ?? 0 : 0;

  const loyaltyCap = studioConfig?.settings.loyaltyCapPercent ?? 30;
  const availablePoints = loyalty?.points ?? 0;
  const maxPointsByCap = Math.floor(subtotal * (loyaltyCap / 100) * 10);
  const pointsToUse = Math.min(availablePoints, maxPointsByCap);
  const canUsePoints = availablePoints > 0 && pointsToUse > 0;
  const discount = applyPoints && canUsePoints ? pointsToUse / 10 : 0;
  const total = Math.round((subtotal - discount + deliveryFee) * 100) / 100;
  const hasBlockedItem = items.some((i) => !i.in_stock);
  const empty = !isLoading && items.length === 0;

  return (
    <Layout>
      <StudioPageHero
        eyebrow="Your bag"
        title="Almost yours."
        description="Review your selected products before completing your purchase."
        variant="compact"
      />

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Link
            to="/shop"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Continue shopping
          </Link>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : empty ? (
            <div className="mx-auto max-w-md py-12 text-center">
              <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-primary/40" />
              <h2 className="font-serif text-2xl font-bold">Your bag is empty</h2>
              <p className="mt-2 text-muted-foreground">
                Looks like you haven't found your next beauty essential yet.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild>
                  <Link to="/shop">Explore shop</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/services">Explore services</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Items */}
              <div className="lg:col-span-2">
                <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Your items
                </h2>
                <div className="divide-y divide-border border-y border-border">
                  {items.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-center gap-4 py-5 animate-fade-in"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {item.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {GHS(item.unit_price)}
                          {!item.in_stock && (
                            <span className="ml-2 text-destructive">Out of stock</span>
                          )}
                        </p>
                        <div className="mt-2 inline-flex items-center rounded-full border border-border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              updateMutation.mutate({
                                productId: item.product_id,
                                quantity: item.quantity - 1,
                              })
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            aria-label="Increase quantity"
                            disabled={
                              item.max_qty !== null && item.quantity >= item.max_qty
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
                          {GHS(item.line_total)}
                        </p>
                        <button
                          className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
                          onClick={() => removeMutation.mutate(item.product_id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
                  <h2 className="font-serif text-lg font-semibold">Order summary</h2>

                  {/* Fulfillment */}
                  <div className="mt-5">
                    <p className="mb-2 text-sm font-medium text-foreground">Fulfilment</p>
                    <div className="grid gap-2">
                      {commerce?.enable_pickup && (
                        <button
                          type="button"
                          onClick={() => setFulfillment("PICKUP")}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-colors",
                            fulfillment === "PICKUP"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50",
                          )}
                        >
                          <Store className="h-4 w-4 text-primary" />
                          Pickup at studio
                          <span className="ml-auto text-muted-foreground">Free</span>
                        </button>
                      )}
                      {commerce?.enable_delivery && (
                        <button
                          type="button"
                          onClick={() => setFulfillment("DELIVERY")}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-colors",
                            fulfillment === "DELIVERY"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50",
                          )}
                        >
                          <Truck className="h-4 w-4 text-primary" />
                          Delivery
                          <span className="ml-auto text-muted-foreground">
                            {commerce.delivery_fee > 0
                              ? GHS(commerce.delivery_fee)
                              : "Free"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {fulfillment === "DELIVERY" && (
                    <div className="mt-3 space-y-2">
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

                  {canUsePoints && (
                    <div className="mt-4 flex items-start justify-between gap-3 border-t border-border pt-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Use my loyalty points
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Save {GHS(pointsToUse / 10)} ({pointsToUse} pts) — up to{" "}
                          {loyaltyCap}% off.
                        </p>
                      </div>
                      <Switch checked={applyPoints} onCheckedChange={setApplyPoints} />
                    </div>
                  )}

                  <div className="mt-4 space-y-1">
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

                  <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">{GHS(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Points discount</span>
                        <span className="text-green-600">− {GHS(discount)}</span>
                      </div>
                    )}
                    {deliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery</span>
                        <span className="text-foreground">{GHS(deliveryFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 text-base font-semibold">
                      <span className="text-foreground">Total</span>
                      <span className="text-primary">{GHS(total)}</span>
                    </div>
                  </div>

                  <Button
                    className="mt-5 w-full"
                    size="lg"
                    disabled={redirecting || hasBlockedItem}
                    onClick={handleCheckout}
                  >
                    {redirecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {redirecting ? "Redirecting…" : "Proceed to checkout"}
                  </Button>
                  {hasBlockedItem && (
                    <p className="mt-2 text-center text-xs text-destructive">
                      Remove out-of-stock items to continue.
                    </p>
                  )}
                  <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" /> Secure checkout via Paystack
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Sticky mobile checkout bar */}
      {!empty && !isLoading && items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur-md [padding-bottom:calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-semibold text-primary">{GHS(total)}</p>
          </div>
          <Button
            className="ml-auto flex-1"
            size="lg"
            disabled={redirecting || hasBlockedItem}
            onClick={handleCheckout}
          >
            {redirecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Checkout
          </Button>
        </div>
      )}

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        target={paymentTarget}
        title="Pay for your order"
        onSuccess={(reference) =>
          navigate(`/order/callback?reference=${encodeURIComponent(reference)}`)
        }
      />
    </Layout>
  );
};

export default Cart;
