import { useSeo } from "@/lib/seo";
import { processingFeeFor } from "@/lib/fees";
import { useStudio } from "@/hooks/useStudio";
import { useEffect, useState } from "react";
import { PROCESSING, useProcessing } from "@/components/ProcessingOverlay";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Heart,
  MessageSquare,
  PackageCheck,
  ShoppingCart,
  Star,
  Loader2,
  ImageOff,
  Minus,
  Plus,
  Store,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Breadcrumbs, ProductCard, ProductRow } from "@/components/shop/ProductCard";
import { SectionTitle } from "@/components/shop/HomeSections";
import { Stars } from "@/components/shop/Stars";
import { useWishlist } from "@/hooks/useWishlist";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShopLayout as Layout } from "@/components/shop/ShopLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { productsApi, productCategoriesApi, productReviewsApi, cartApi, ordersApi, commerceApi } from "@/lib/api";
import { optionPrice, optionBase, hasOptionPrices } from "@/lib/api/products";
import { ApiError } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { setPendingCartAdd, takePendingCartAdd } from "@/lib/pendingCart";
import { DeliveryChoice, deliveryPickBody, deliveryPickMissing, type DeliveryPick } from "@/components/shop/DeliveryChoice";
import { deliveryFeeFor } from "@/lib/api/commerce";
import { Captcha, captchaReady } from "@/components/Captcha";
import { formatGHS } from "@/lib/currency";

const RECENT_KEY = "zuri_recently_viewed";
const lineTotal_ = (price: number, qty: number) => Math.round(price * qty * 100) / 100;

const ProductDetail = () => {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const { config, name: studioName } = useStudio();
  const navigate = useNavigate();
  const { toast } = useToast();
  const processing = useProcessing();
  const queryClient = useQueryClient();
  const wishlist = useWishlist();

  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  // When buying more than one, each extra item can have its own size and colour.
  // The main pickers below are item 1; these are items 2 and up.
  const [extras, setExtras] = useState<{ size: string; color: string }[]>([]);
  const [tab, setTab] = useState<"description" | "comments">("description");
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  // Guest express-checkout form.
  const [guest, setGuest] = useState({ name: "", email: "", phone: "" });
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [pick, setPick] = useState<DeliveryPick>({});
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
    setPhoto(0);
    setSize("");
    setColor("");
    setExtras([]);
    try {
      const seen = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
      setRecentIds(seen);
      localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...seen.filter((x) => x !== id)].slice(0, 8)));
    } catch {
      /* Storage unavailable: the row just stays hidden. */
    }
  }, [id]);

  const { data: reviews = [] } = useQuery({
    queryKey: ["product-reviews", id],
    queryFn: () => productReviewsApi.list(id),
    enabled: !!id,
  });
  const reviewMutation = useMutation({
    mutationFn: () => productReviewsApi.add(id, myRating, myReview),
    onSuccess: (message) => {
      setMyRating(0);
      setMyReview("");
      toast({ title: "Review sent", description: message });
    },
    onError: (e) =>
      toast({ variant: "destructive", title: "Couldn't send your review", description: e instanceof Error ? e.message : "Please try again." }),
  });

  const maxQty = product?.track_stock ? product.stock : 99;
  useEffect(() => {
    setExtras((rows) => {
      const want = Math.max(0, qty - 1);
      if (rows.length === want) return rows;
      if (rows.length > want) return rows.slice(0, want);
      return [...rows, ...Array.from({ length: want - rows.length }, () => ({ size, color }))];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qty]);
  // The basket lines this adds up to: identical size+colour items are one line.
  const variantLines = () => {
    const all = [{ size, color }, ...extras.slice(0, Math.max(0, qty - 1))];
    const byKey = new Map<string, { size: string; color: string; quantity: number }>();
    for (const v of all) {
      const key = v.size + "|" + v.color;
      const line = byKey.get(key);
      if (line) line.quantity += 1;
      else byKey.set(key, { ...v, quantity: 1 });
    }
    return [...byKey.values()];
  };

  // Search and share details: the product's name, price, stock and rating.
  useSeo({
    title: product ? `${product.name} · ${studioName}` : studioName,
    description: product?.description,
    image: product?.image_url,
    structuredData: product
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          ...(product.description ? { description: product.description } : {}),
          ...(product.images.length ? { image: product.images } : {}),
          ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
          offers: {
            "@type": "Offer",
            price: product.effective_price.toFixed(2),
            priceCurrency: "GHS",
            availability: product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: window.location.href,
          },
          ...(product.rating_average && product.rating_count
            ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(product.rating_average.toFixed(1)), reviewCount: product.rating_count } }
            : {}),
        }
      : null,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      for (const line of variantLines()) await cartApi.addItem(id, line.quantity, line.size, line.color);
    },
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

  // Each option the product offers has to be chosen before it can be bought.
  const optionsChosen = () => {
    const rows = [{ size, color }, ...extras.slice(0, Math.max(0, qty - 1))];
    const missing = rows.some((r) => product?.sizes.length && !r.size)
      ? "size"
      : rows.some((r) => product?.colors.length && !r.color)
        ? "colour"
        : null;
    if (missing) toast({ variant: "destructive", title: qty > 1 ? `Choose a ${missing} for every item` : `Choose a ${missing}` });
    return !missing;
  };

  const handleAddToCart = () => {
    if (!optionsChosen()) return;
    // No account needed: a visitor's basket stays on their own device.
    if (user?.role === "ADMIN") {
      toast({ variant: "destructive", title: "Admins can't shop" });
      return;
    }
    addMutation.mutate();
  };

  const handleGuestBuy = async () => {
    if (!optionsChosen()) return;
    if (!guest.name.trim() || !guest.email.trim() || !guest.phone.trim()) {
      toast({
        variant: "destructive",
        title: "Details needed",
        description: "Enter your name, email and phone.",
      });
      return;
    }
    if (!captchaReady()) {
      toast({ variant: "destructive", title: "Complete the security check first" });
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
    const missing = fulfillment === "DELIVERY" ? deliveryPickMissing(commerce, pick) : null;
    if (missing) {
      toast({ variant: "destructive", title: "Delivery details needed", description: missing });
      return;
    }
    try {
      setRedirecting(true);
      // Stays up until the browser leaves for Paystack's checkout page.
      processing.show(PROCESSING.preparing);
      const res = await ordersApi.guestCheckout({
        items: variantLines().map((l) => ({ productId: id, quantity: l.quantity, size: l.size, color: l.color })),
        name: guest.name.trim(),
        email: guest.email.trim(),
        phone: guest.phone.trim(),
        fulfillment,
        deliveryAddress: fulfillment === "DELIVERY" ? address.trim() : undefined,
        deliveryPhone: fulfillment === "DELIVERY" ? guest.phone.trim() : undefined,
        ...(fulfillment === "DELIVERY" ? deliveryPickBody(pick) : {}),
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
  // Each unit is priced by its own option, so a mix of options adds up right.
  const unitRows = variantLines();
  const lineTotal = lineTotal_(1, unitRows.reduce((n, l) => n + optionPrice(product, l.size) * l.quantity, 0));
  const lineBefore = lineTotal_(1, unitRows.reduce((n, l) => n + optionBase(product, l.size) * l.quantity, 0));
  const guestTotal = lineTotal + (fulfillment === "DELIVERY" ? deliveryFeeFor(commerce, pick.zoneId) : 0);
  const categoryName = categories.find((c) => c.slug === product.category)?.name ?? product.category.replace(/-/g, " ");
  const others = allProducts.filter((p) => p.id !== product.id);
  // Same category first, then pieces for the same audience, eight in all.
  const similarPicks = [
    ...others.filter((p) => p.category === product.category),
    ...others.filter((p) => p.category !== product.category && p.audience === product.audience),
  ].slice(0, 8);
  const recent = recentIds
    .filter((x) => x !== product.id)
    .map((x) => others.find((p) => p.id === x))
    .filter((p): p is NonNullable<typeof p> => !!p);

  const audienceCrumb =
    product.audience === "MEN"
      ? { label: "Men", to: "/shop/products?audience=men" }
      : product.audience === "WOMEN"
        ? { label: "Women", to: "/shop/products?audience=women" }
        : null;
  const photos = product.images;
  const current = photos[Math.min(photo, Math.max(photos.length - 1, 0))];
  const feature = photos[1] ?? photos[0];
  const perks = [
    { icon: CreditCard, label: "Secure payment", hint: "Mobile Money or card" },
    ...(commerce?.enable_pickup ? [{ icon: Store, label: "Free pickup", hint: "Collect it from us" }] : []),
    ...(commerce?.enable_delivery
      ? [{ icon: Truck, label: commerce?.delivery_zones.length ? "Delivery by area" : deliveryFee > 0 ? `Delivery ${formatGHS(deliveryFee)}` : "Free delivery", hint: "Choose at checkout" }]
      : []),
    {
      icon: PackageCheck,
      label: product.in_stock ? (product.track_stock && product.stock <= 5 ? `Only ${product.stock} left` : "In stock") : "Sold out",
      hint: product.in_stock ? "Ready to send" : "Check back soon",
    },
  ];

  return (
    <Layout>
      <section className="border-b border-border">
        <div className="container mx-auto grid gap-8 px-4 py-6 md:grid-cols-2 md:gap-12 md:py-10">
          {/* Photos: thumbnails beside the main one on wide screens, below it on phones. */}
          <div className="flex flex-col-reverse gap-3 rounded-3xl bg-muted/60 p-3 md:flex-row md:p-4">
            {photos.length > 1 && (
              <div className="flex gap-3 overflow-x-auto md:max-h-[34rem] md:flex-col md:overflow-y-auto [scrollbar-width:none]">
                {photos.slice(0, 8).map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    aria-label={`Photo ${i + 1}`}
                    aria-current={photo === i}
                    onClick={() => setPhoto(i)}
                    className={cn(
                      "h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-background transition-opacity md:h-20 md:w-20",
                      photo === i ? "border-foreground" : "border-transparent opacity-70 hover:opacity-100",
                    )}
                  >
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-2xl bg-muted">
              {current ? (
                <img src={current} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground"><ImageOff className="h-12 w-12" /></div>
              )}
              <button
                type="button"
                aria-pressed={wishlist.has(product.id)}
                aria-label={wishlist.has(product.id) ? "Remove from wishlist" : "Save to wishlist"}
                onClick={() => wishlist.toggle(product.id)}
                className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm"
              >
                <Heart className={cn("h-5 w-5", wishlist.has(product.id) && "fill-current text-rose-500")} aria-hidden />
              </button>
            </div>
          </div>

          <div className="md:py-2">
            <Breadcrumbs
              items={[
                { label: "Shop", to: "/shop/products" },
                ...(audienceCrumb ? [audienceCrumb] : []),
                { label: categoryName, to: `/shop/products?category=${product.category}` },
              ]}
            />
            <h1 className="mt-4 max-w-md text-balance text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{product.name}</h1>
            {product.brand && <p className="mt-1 text-sm text-muted-foreground">{product.brand}</p>}
            <a href="#description" onClick={() => setTab("comments")} className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {product.rating_average !== null && <Stars value={product.rating_average} className="text-sm" />}
              {product.rating_average !== null && <span className="tabular-nums">{product.rating_average.toFixed(1)}</span>}
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" aria-hidden /> {reviews.length} {reviews.length === 1 ? "comment" : "comments"}
              </span>
            </a>

            <p className="mt-4 text-2xl font-semibold tabular-nums">
              {product.on_promo && <span className="mr-2 text-base font-normal text-muted-foreground line-through">{formatGHS(optionBase(product, size || null))}</span>}
              {hasOptionPrices(product) && !size && <span className="mr-1.5 text-base font-normal text-muted-foreground">From</span>}
              {formatGHS(optionPrice(product, size || null))}
              {product.unit && <span className="ml-1 text-base font-normal text-muted-foreground">per {product.unit}</span>}
            </p>

            {product.sizes.length > 0 && (
              <div className="mt-7">
                <p className="text-sm font-semibold">{product.variants.length > 0 ? "Choose an option" : "Select size"}</p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {product.sizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      aria-pressed={size === sz}
                      onClick={() => setSize(sz)}
                      className={cn(
                        "h-10 min-w-10 rounded-xl border px-3 text-sm transition-colors",
                        size === sz ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground",
                      )}
                    >
                      {sz}
                      {hasOptionPrices(product) && <span className={cn("ml-1.5 text-xs", size === sz ? "opacity-80" : "text-muted-foreground")}>{formatGHS(optionPrice(product, sz))}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {product.colors.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold">
                  Colours available{color && <span className="font-normal text-muted-foreground"> · {color}</span>}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      title={c.name}
                      aria-label={c.name}
                      aria-pressed={color === c.name}
                      onClick={() => setColor(c.name)}
                      className={cn(
                        "h-8 w-8 rounded-full border border-border ring-offset-2 ring-offset-background transition-shadow",
                        color === c.name && "ring-2 ring-foreground",
                      )}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {qty > 1 && (product.sizes.length > 0 || product.colors.length > 0) && (
              <div className="mt-6 rounded-xl border border-border p-4">
                <p className="text-sm font-semibold">Choose for each item</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Item 1 uses the choices above. Pick a different size or colour for the others if you like.</p>
                <ul className="mt-3 space-y-2">
                  {extras.slice(0, qty - 1).map((row, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="w-14 text-muted-foreground">Item {i + 2}</span>
                      {product.sizes.length > 0 && (
                        <select
                          aria-label={`Size for item ${i + 2}`}
                          className="h-9 rounded-lg border border-input bg-background px-2"
                          value={row.size}
                          onChange={(e) => setExtras((rs) => rs.map((r, j) => (j === i ? { ...r, size: e.target.value } : r)))}
                        >
                          <option value="">Size</option>
                          {product.sizes.map((sz) => <option key={sz} value={sz}>{sz}</option>)}
                        </select>
                      )}
                      {product.colors.length > 0 && (
                        <select
                          aria-label={`Colour for item ${i + 2}`}
                          className="h-9 rounded-lg border border-input bg-background px-2"
                          value={row.color}
                          onChange={(e) => setExtras((rs) => rs.map((r, j) => (j === i ? { ...r, color: e.target.value } : r)))}
                        >
                          <option value="">Colour</option>
                          {product.colors.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.in_stock ? (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <div className="flex h-12 items-center rounded-xl border border-input">
                  <button type="button" aria-label="Less" className="h-full px-3.5 disabled:opacity-40" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></button>
                  <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
                  <button type="button" aria-label="More" className="h-full px-3.5 disabled:opacity-40" disabled={qty >= maxQty} onClick={() => setQty((q) => Math.min(maxQty, q + 1))}><Plus className="h-4 w-4" /></button>
                </div>
                <Button className="h-12 flex-1 rounded-xl px-6 sm:flex-none" disabled={addMutation.isPending} onClick={handleAddToCart}>
                  {addMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                  Add to cart
                </Button>
                <span className="flex h-12 items-center rounded-xl border border-foreground/80 px-5 text-sm font-semibold tabular-nums">
                  {product.on_promo && <span className="mr-2 font-normal text-muted-foreground line-through">{formatGHS(lineBefore)}</span>}
                  {formatGHS(lineTotal)}
                </span>
              </div>
            ) : (
              <p className="mt-8 rounded-xl border border-border p-4 text-sm font-medium">Sold out. Check back soon.</p>
            )}

            <hr className="my-7 border-border" />
            <ul className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {perks.map((k) => (
                <li key={k.label} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <k.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{k.label}</span>
                    <span className="block text-xs text-muted-foreground">{k.hint}</span>
                  </span>
                </li>
              ))}
            </ul>

            {!user && product.in_stock && (
              <Accordion type="single" collapsible className="mt-7 border-t border-border">
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
                        <>
                          <Textarea placeholder="Delivery address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
                          <DeliveryChoice settings={commerce} value={pick} onChange={setPick} />
                        </>
                      )}
                      <div>
                        <Label htmlFor="referral" className="text-xs text-muted-foreground">Referral code (optional)</Label>
                        <Input id="referral" value={referral} onChange={(e) => setReferral(e.target.value)} />
                      </div>
                      <Captcha />
                      <Button type="button" className="h-11 w-full rounded-xl" disabled={redirecting} onClick={handleGuestBuy}>
                        {redirecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Pay {formatGHS(guestTotal + processingFeeFor(guestTotal, config?.settings))}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </div>
      </section>

      {/* Product description: tabs for the write-up and the comments, a photo beside. */}
      <section id="description" className="container mx-auto scroll-mt-24 px-4 py-12 md:py-16">
        <SectionTitle>Product description</SectionTitle>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12">
          <div>
            <div className="flex gap-6 border-b border-border text-sm" role="tablist">
              {(
                [
                  ["description", "Description", null],
                  ["comments", "User comments", reviews.length],
                ] as const
              ).map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "-mb-px flex items-center gap-2 border-b-2 pb-3 font-medium",
                    tab === key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                  {count !== null && <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] tabular-nums text-primary-foreground">{count}</span>}
                </button>
              ))}
            </div>

            {tab === "description" ? (
              <div className="pt-6">
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {product.description || "The owner hasn't added a description yet."}
                </p>
                {product.attributes.length > 0 && (
                  <dl className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl bg-muted/60 sm:grid-cols-3">
                    {product.attributes.map((a) => (
                      <div key={a.label} className="border-b border-r border-border/70 px-5 py-4">
                        <dt className="text-xs text-muted-foreground">{a.label}</dt>
                        <dd className="mt-1 text-sm font-medium">{a.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            ) : (
              <div className="pt-6">
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No comments yet. Customers who buy it can leave one.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {reviews.map((r) => (
                      <figure key={r.id} className="rounded-2xl border border-border p-5">
                        <Stars value={r.rating} />
                        {r.content && <blockquote className="mt-2 text-sm">{r.content}</blockquote>}
                        <figcaption className="mt-3 text-xs text-muted-foreground">{r.user.profile?.fullName ?? "Customer"}</figcaption>
                      </figure>
                    ))}
                  </div>
                )}
                {isCustomer && (
                  <form
                    className="mt-6 max-w-lg space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      reviewMutation.mutate();
                    }}
                  >
                    <p className="text-sm font-medium">Bought this? Tell others what you think.</p>
                    <div className="flex gap-1" role="radiogroup" aria-label="Your rating">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" role="radio" aria-checked={myRating === n} aria-label={`${n} stars`} onClick={() => setMyRating(n)} className="p-1">
                          <Star className={cn("h-6 w-6", n <= myRating ? "fill-current text-amber-400" : "opacity-30")} aria-hidden />
                        </button>
                      ))}
                    </div>
                    <Textarea value={myReview} onChange={(e) => setMyReview(e.target.value)} rows={3} maxLength={1000} placeholder="Your comment (optional)" />
                    <Button type="submit" variant="outline" disabled={!myRating || reviewMutation.isPending}>Send comment</Button>
                  </form>
                )}
              </div>
            )}
          </div>

          {feature && (
            <figure className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted lg:aspect-auto lg:min-h-[18rem]">
              <img src={feature} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-5 text-center text-sm font-medium text-white md:text-base">{product.name}</figcaption>
            </figure>
          )}
        </div>
      </section>

      {similarPicks.length > 0 && (
        <section className="container mx-auto px-4 pb-12 md:pb-16">
          <SectionTitle action={{ label: "View all", to: `/shop/products?category=${product.category}` }}>Similar products</SectionTitle>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
            {similarPicks.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      <ProductRow title="Recently viewed" products={recent} />
    </Layout>
  );
};

export default ProductDetail;
