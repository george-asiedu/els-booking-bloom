import { useEffect, useState } from "react";
import { PROCESSING, useProcessing } from "@/components/ProcessingOverlay";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Loader2,
  ImageOff,
  Minus,
  Plus,
  Store,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Breadcrumbs, ProductRow, SHOP_CTA } from "@/components/shop/ProductCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShopLayout as Layout } from "@/components/shop/ShopLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { productsApi, productCategoriesApi, cartApi, ordersApi, commerceApi } from "@/lib/api";
import { ApiError } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { setPendingCartAdd, takePendingCartAdd } from "@/lib/pendingCart";
import { formatGHS } from "@/lib/currency";

const RECENT_KEY = "zuri_recently_viewed";

const ProductDetail = () => {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const processing = useProcessing();
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

  const { data: allProducts = [] } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => productsApi.listActive(),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["public-product-categories"],
    queryFn: () => productCategoriesApi.listActive(),
  });

  // Recently viewed, kept in this browser only.
  const [recentIds, setRecentIds] = useState<string[]>([]);
  useEffect(() => {
    if (!id) return;
    setQty(1);
    try {
      const seen = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
      setRecentIds(seen);
      localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...seen.filter((x) => x !== id)].slice(0, 8)));
    } catch {
      /* Storage unavailable: the row just stays hidden. */
    }
  }, [id]);

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
      // Stays up until the browser leaves for Paystack's checkout page.
      processing.show(PROCESSING.preparing);
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
      processing.hide();
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
  const categoryName = categories.find((c) => c.slug === product.category)?.name ?? product.category.replace(/-/g, " ");
  const others = allProducts.filter((p) => p.id !== product.id);
  const similar = others.filter((p) => p.category === product.category);
  const recent = recentIds
    .filter((x) => x !== product.id)
    .map((x) => others.find((p) => p.id === x))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <Layout>
      <section className="container mx-auto px-4 py-6 md:py-8">
        <Breadcrumbs
          items={[
            { label: "Shop", to: "/shop" },
            { label: categoryName, to: `/shop/products?category=${product.category}` },
            { label: product.name },
          ]}
        />
        <div className="mt-6 grid gap-8 md:grid-cols-2 lg:gap-14">
          <div className="relative aspect-[8/9] overflow-hidden bg-muted">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground"><ImageOff className="h-12 w-12" /></div>
            )}
          </div>

          <div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">{product.name}</h1>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-muted-foreground">
              {product.on_promo && <span className="mr-2 text-lg font-normal line-through">{formatGHS(product.price)}</span>}
              {formatGHS(product.effective_price)}
            </p>
            <hr className="my-6 border-border" />
            {product.description && <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{product.description}</p>}

            {product.in_stock ? (
              <>
                <div className="mt-7 flex gap-3">
                  <div className="flex h-12 items-center border border-input">
                    <button type="button" aria-label="Less" className="h-full px-3.5 disabled:opacity-40" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></button>
                    <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
                    <button type="button" aria-label="More" className="h-full px-3.5 disabled:opacity-40" disabled={qty >= maxQty} onClick={() => setQty((q) => Math.min(maxQty, q + 1))}><Plus className="h-4 w-4" /></button>
                  </div>
                  <button type="button" className={cn(SHOP_CTA, "flex-1 px-3")} disabled={addMutation.isPending} onClick={handleAddToCart}>
                    {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add to bag — {formatGHS(lineTotal)}
                  </button>
                </div>
                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4" aria-hidden />
                    {product.track_stock && product.stock <= 5 ? `Only ${product.stock} left in stock` : "In stock"}
                  </li>
                  {commerce?.enable_pickup && <li className="flex items-center gap-2"><Check className="h-4 w-4" aria-hidden /> Pick up from us for free</li>}
                  {commerce?.enable_delivery && (
                    <li className="flex items-center gap-2"><Check className="h-4 w-4" aria-hidden />
                      Delivery {deliveryFee > 0 ? `for ${formatGHS(deliveryFee)}` : "available"}
                    </li>
                  )}
                </ul>
              </>
            ) : (
              <p className="mt-7 border border-border p-4 text-sm font-medium">Sold out. Check back soon.</p>
            )}

            <Accordion type="multiple" className="mt-6 border-t border-border">
              <AccordionItem value="delivery">
                <AccordionTrigger className="hover:no-underline">Delivery and pickup</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {commerce?.enable_pickup && "Collect your order from us at no charge. "}
                  {commerce?.enable_delivery && `We can deliver to you${deliveryFee > 0 ? ` for ${formatGHS(deliveryFee)}` : ""}. `}
                  You choose at checkout.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pay">
                <AccordionTrigger className="hover:no-underline">Payment</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Pay securely by Mobile Money or card. You'll get a receipt by email.
                </AccordionContent>
              </AccordionItem>
              {!user && product.in_stock && (
                <AccordionItem value="guest">
                  <AccordionTrigger className="hover:no-underline">Buy without an account</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 p-0.5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input placeholder="Your name" value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} />
                        <Input placeholder="Phone" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} />
                      </div>
                      <Input type="email" placeholder="Email" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} />
                      <div className="flex gap-2">
                        {commerce?.enable_pickup && (
                          <Button type="button" variant={fulfillment === "PICKUP" ? "default" : "outline"} size="sm" onClick={() => setFulfillment("PICKUP")}><Store className="mr-2 h-4 w-4" /> Pickup</Button>
                        )}
                        {commerce?.enable_delivery && (
                          <Button type="button" variant={fulfillment === "DELIVERY" ? "default" : "outline"} size="sm" onClick={() => setFulfillment("DELIVERY")}><Truck className="mr-2 h-4 w-4" /> Delivery</Button>
                        )}
                      </div>
                      {fulfillment === "DELIVERY" && (
                        <Textarea placeholder="Delivery address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
                      )}
                      <div>
                        <Label htmlFor="referral" className="text-xs text-muted-foreground">Referral code (optional)</Label>
                        <Input id="referral" value={referral} onChange={(e) => setReferral(e.target.value)} />
                      </div>
                      <button type="button" className={cn(SHOP_CTA, "w-full")} disabled={redirecting} onClick={handleGuestBuy}>
                        {redirecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Pay {formatGHS(lineTotal + (fulfillment === "DELIVERY" ? deliveryFee : 0))}
                      </button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        </div>
      </section>

      <ProductRow title="Similar items you might like" products={similar.length ? similar : others} />
      <ProductRow title="Recently viewed" products={recent} />
    </Layout>
  );
};

export default ProductDetail;
