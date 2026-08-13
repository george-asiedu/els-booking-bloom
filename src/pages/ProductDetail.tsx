import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingCart,
  Loader2,
  ImageOff,
  Minus,
  Plus,
  ArrowLeft,
  Store,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { productsApi, cartApi, ordersApi, commerceApi } from "@/lib/api";
import { ApiError } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { setPendingCartAdd, takePendingCartAdd } from "@/lib/pendingCart";

const ProductDetail = () => {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [qty, setQty] = useState(1);
  const [redirecting, setRedirecting] = useState(false);
  // Guest express-checkout form.
  const [guest, setGuest] = useState({ name: "", email: "", phone: "" });
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [address, setAddress] = useState("");
  const [referral, setReferral] = useState("");

  const isCustomer = !!user && user.role !== "ADMIN";

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.getOne(id),
    enabled: !!id,
  });

  const { data: commerce } = useQuery({
    queryKey: ["commerce-settings"],
    queryFn: () => commerceApi.getSettings(),
  });

  const maxQty = product?.track_stock ? product.stock : 99;

  const addMutation = useMutation({
    mutationFn: () => cartApi.addItem(id, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Added to cart", description: `${product?.name} × ${qty}` });
    },
    onError: (e) => {
      // Session expired: stash the item so it's added right after re-login;
      // SessionGuard shows the message and redirects back to this page.
      if (e instanceof ApiError && e.status === 401) {
        setPendingCartAdd(id);
        return;
      }
      toast({
        variant: "destructive",
        title: "Couldn't add to cart",
        description: e instanceof Error ? e.message : "Please try again.",
      });
    },
  });

  // Resume an add-to-cart attempted before being sent to log in (guest or an
  // expired session), once the customer is back and authenticated.
  useEffect(() => {
    if (!isCustomer) return;
    const pid = takePendingCartAdd();
    if (!pid) return;
    cartApi
      .addItem(pid, 1)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        toast({
          title: "Added to cart",
          description: "Picked up where you left off.",
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCustomer]);

  const handleAddToCart = () => {
    if (!user) {
      setPendingCartAdd(id);
      navigate(`/login?redirect=/shop/${id}`);
      return;
    }
    if (user.role === "ADMIN") {
      toast({ variant: "destructive", title: "Admins can't shop" });
      return;
    }
    addMutation.mutate();
  };

  const handleGuestBuy = async () => {
    if (!guest.name.trim() || !guest.email.trim() || !guest.phone.trim()) {
      toast({
        variant: "destructive",
        title: "Details needed",
        description: "Enter your name, email and phone.",
      });
      return;
    }
    if (fulfillment === "DELIVERY" && !address.trim()) {
      toast({
        variant: "destructive",
        title: "Address needed",
        description: "Enter a delivery address.",
      });
      return;
    }
    try {
      setRedirecting(true);
      const res = await ordersApi.guestCheckout({
        items: [{ productId: id, quantity: qty }],
        name: guest.name.trim(),
        email: guest.email.trim(),
        phone: guest.phone.trim(),
        fulfillment,
        deliveryAddress: fulfillment === "DELIVERY" ? address.trim() : undefined,
        deliveryPhone: fulfillment === "DELIVERY" ? guest.phone.trim() : undefined,
        referralCode: referral.trim() || undefined,
      });
      window.location.href = res.authorization_url;
    } catch (e) {
      setRedirecting(false);
      toast({
        variant: "destructive",
        title: "Couldn't start checkout",
        description: e instanceof Error ? e.message : "Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <section className="py-16 container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-80 w-full" />
        </section>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <section className="py-20 text-center">
          <p className="text-muted-foreground mb-4">Product not found.</p>
          <Button asChild>
            <Link to="/shop">Back to shop</Link>
          </Button>
        </section>
      </Layout>
    );
  }

  const deliveryFee = commerce?.delivery_fee ?? 0;
  const lineTotal = Math.round(product.effective_price * qty * 100) / 100;

  return (
    <Layout>
      <section className="py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/shop">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to shop
            </Link>
          </Button>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Image */}
            <div className="aspect-square rounded-lg bg-secondary overflow-hidden flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageOff className="h-16 w-16 text-muted-foreground" />
              )}
            </div>

            {/* Info */}
            <div>
              <div className="flex gap-2 mb-2">
                {product.popular && <Badge>Popular</Badge>}
                {product.on_promo && (
                  <Badge className="bg-green-600 hover:bg-green-600">Promo</Badge>
                )}
                {!product.in_stock && <Badge variant="secondary">Out of stock</Badge>}
              </div>
              <h1 className="text-3xl font-serif font-bold text-foreground">
                {product.name}
              </h1>
              <div className="mt-2 mb-4">
                {product.on_promo ? (
                  <span className="flex items-baseline gap-2">
                    <span className="text-muted-foreground line-through">
                      GHS {product.price}
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      GHS {product.effective_price}
                    </span>
                  </span>
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    GHS {product.price}
                  </span>
                )}
              </div>
              {product.description && (
                <p className="text-muted-foreground mb-6">{product.description}</p>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm font-medium text-foreground">Quantity</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={qty <= 1}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center">{qty}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={qty >= maxQty}
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {product.track_stock && product.in_stock && product.stock <= 5 && (
                  <span className="text-xs text-amber-600">
                    {product.stock} left
                  </span>
                )}
              </div>

              {/* Add to cart */}
              <Button
                size="lg"
                className="w-full"
                disabled={!product.in_stock || addMutation.isPending}
                onClick={handleAddToCart}
              >
                {addMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="mr-2 h-4 w-4" />
                )}
                {product.in_stock ? "Add to cart" : "Out of stock"}
              </Button>
              {isCustomer && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Added items are in your <Link to="/cart" className="text-primary underline">cart</Link>.
                </p>
              )}
            </div>
          </div>

          {/* Guest express checkout */}
          {!isCustomer && product.in_stock && (
            <Card className="mt-10 max-w-xl">
              <CardContent className="py-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Buy now — no account needed
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Pay securely and we'll get your order ready. Or{" "}
                    <Link to={`/login?redirect=/shop/${id}`} className="text-primary underline">
                      log in
                    </Link>{" "}
                    to use your cart and loyalty points.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Full name"
                    value={guest.name}
                    onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                  />
                  <Input
                    placeholder="Phone"
                    value={guest.phone}
                    onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Email (for your receipt)"
                  value={guest.email}
                  onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                />

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
                      <Store className="h-4 w-4 text-primary" /> Pickup at studio
                      <span className="ml-auto text-muted-foreground">Free</span>
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
                      <Truck className="h-4 w-4 text-primary" /> Delivery
                      <span className="ml-auto text-muted-foreground">
                        {deliveryFee > 0 ? `GHS ${deliveryFee}` : "Free"}
                      </span>
                    </button>
                  )}
                </div>

                {fulfillment === "DELIVERY" && (
                  <Textarea
                    placeholder="Delivery address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                )}

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

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">You'll pay</span>
                  <span className="text-lg font-bold text-primary">
                    GHS{" "}
                    {Math.round(
                      (lineTotal + (fulfillment === "DELIVERY" ? deliveryFee : 0)) *
                        100,
                    ) / 100}
                  </span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={redirecting}
                  onClick={handleGuestBuy}
                >
                  {redirecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {redirecting ? "Redirecting…" : "Buy now"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ProductDetail;
