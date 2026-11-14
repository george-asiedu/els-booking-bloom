import { vouchersApi, type VoucherCheck } from "@/lib/api/vouchers";
import { useStudio } from "@/hooks/useStudio";
import { processingFeeFor } from "@/lib/fees";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, LocateFixed } from "lucide-react";
import { CouponBox } from "@/components/shop/CouponBox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PROCESSING, useProcessing } from "@/components/ProcessingOverlay";
import { PaymentDialog } from "@/components/payment/PaymentDialog";
import { ShopLayout as Layout } from "@/components/shop/ShopLayout";
import { SHOP_CTA } from "@/components/shop/ProductCard";
import { cartApi, commerceApi, ordersApi, PaymentTarget } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatGHS as GHS } from "@/lib/currency";
import { DeliveryChoice, deliveryPickBody, deliveryPickMissing, type DeliveryPick } from "@/components/shop/DeliveryChoice";
import { deliveryFeeFor } from "@/lib/api/commerce";
import { cn } from "@/lib/utils";

/** "You're almost there" (checkout): delivery details beside the order summary. */
const Checkout = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const processing = useProcessing();
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [pick, setPick] = useState<DeliveryPick>({});
  const [busy, setBusy] = useState(false);
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  // What the map shows: settles after typing stops, so it doesn't reload per key.
  const [mapQuery, setMapQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<PaymentTarget | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const isCustomer = !!user && user.role !== "ADMIN";

  const { data: commerce } = useQuery({
    queryKey: ["commerce-settings"],
    queryFn: () => commerceApi.getSettings(),
  });
  const { config } = useStudio();
  const [giftInput, setGiftInput] = useState("");
  const [giftCard, setGiftCard] = useState<VoucherCheck | null>(null);
  const checkGift = useMutation({
    mutationFn: () => vouchersApi.check(giftInput),
    onSuccess: (v) => {
      if (v.kind !== "GIFT_CARD") {
        toast({ variant: "destructive", title: "That's a package code. Use it when you book." });
        return;
      }
      setGiftCard(v);
    },
    onError: (e) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "That code isn't valid" }),
  });
  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartApi.getMine(),
    enabled: isCustomer,
  });
  useEffect(() => {
    if (commerce) setFulfillment(commerce.enable_pickup ? "PICKUP" : "DELIVERY");
  }, [commerce]);

  useEffect(() => {
    const t = setTimeout(() => setMapQuery(address.trim()), 800);
    return () => clearTimeout(t);
  }, [address]);

  if (!isCustomer) return <Navigate to="/cart" replace />;
  if (!isLoading && !paymentOpen && !cart?.items.length) return <Navigate to="/cart" replace />;

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const deliveryFee = fulfillment === "DELIVERY" ? deliveryFeeFor(commerce, pick.zoneId) : 0;
  const beforeGiftCard = Math.round((subtotal - (coupon?.discount ?? 0) + deliveryFee) * 100) / 100;
  // A gift card pays what it can of the rest.
  const giftCardCovers = giftCard ? Math.min(giftCard.balance, beforeGiftCard) : 0;
  const total = Math.round((beforeGiftCard - giftCardCovers) * 100) / 100;
  // Paystack's fee, when this business has customers pay it.
  const processingFee = processingFeeFor(total, config?.settings);

  // The pin shows on the map; the address box gets the place's name (from
  // OpenStreetMap), falling back to the coordinates if the lookup fails.
  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const pin = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
        setMapQuery(pin);
        let place = pin;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=en&lat=${coords.latitude}&lon=${coords.longitude}`,
          );
          const data = (await res.json()) as { address?: Record<string, string>; display_name?: string };
          const a = data.address ?? {};
          const parts = [
            [a.house_number, a.road].filter(Boolean).join(" "),
            a.neighbourhood ?? a.suburb ?? a.quarter,
            a.city ?? a.town ?? a.village ?? a.county,
          ].filter(Boolean);
          place = parts.length ? [...new Set(parts)].join(", ") : data.display_name ?? pin;
        } catch {
          /* Offline or blocked: the coordinates still find the place. */
        }
        setAddress((cur) => (cur.trim() ? `${cur.trim()}, ${place}` : place));
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast({ variant: "destructive", title: "Couldn't get your location", description: "Type your address instead." });
      },
    );
  };


  const proceed = async () => {
    if (fulfillment === "DELIVERY" && (!address.trim() || !phone.trim())) {
      toast({ variant: "destructive", title: "Delivery details needed", description: "Enter a delivery address and phone number." });
      return;
    }
    const missing = fulfillment === "DELIVERY" ? deliveryPickMissing(commerce, pick) : null;
    if (missing) {
      toast({ variant: "destructive", title: "Delivery details needed", description: missing });
      return;
    }
    try {
      setBusy(true);
      processing.show(PROCESSING.preparing);
      const result = await ordersApi.checkout({
        fulfillment,
        deliveryAddress: fulfillment === "DELIVERY" ? address.trim() : undefined,
        deliveryPhone: fulfillment === "DELIVERY" ? phone.trim() : undefined,
        deliveryNote: fulfillment === "DELIVERY" ? deliveryNote.trim() || undefined : undefined,
        ...(fulfillment === "DELIVERY" ? deliveryPickBody(pick) : {}),
        couponCode: coupon?.code,
        giftCardCode: giftCard?.code,
      });
      // A gift card paid it all: straight to the confirmation.
      if (result.paid_with_gift_card) {
        navigate(`/order/callback?reference=${encodeURIComponent(result.reference)}`);
        return;
      }
      setPaymentTarget({
        reference: result.reference,
        amount: result.total,
        email: result.email,
        access_code: result.access_code,
        subaccount: result.subaccount,
        public_key: result.public_key,
        processing_fee: result.processing_fee,
      });
      setPaymentOpen(true);
    } catch (error) {
      toast({ variant: "destructive", title: "Couldn't start checkout", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setBusy(false);
      processing.hide();
    }
  };

  const options = [
    ...(commerce?.enable_pickup ? [{ id: "PICKUP" as const, label: "Collect from us", text: "Pick up your order at no charge." }] : []),
    ...(commerce?.enable_delivery ? [{ id: "DELIVERY" as const, label: "Home delivery", text: commerce.delivery_zones.length ? "Delivered to you. The fee depends on your area." : (commerce.delivery_fee ?? 0) > 0 ? `Delivered to you for ${GHS(commerce.delivery_fee)}.` : "Delivered to you." }] : []),
  ];

  return (
    <Layout>
      <section className="container mx-auto max-w-5xl px-4 py-10 md:py-14">
        <h1 className="text-4xl font-bold tracking-tight">You're almost there</h1>
        <p className="mt-2 text-muted-foreground">
          Check your details, then pay. <Link to="/cart" className="underline underline-offset-2">Back to basket</Link>
        </p>
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-8 border border-border p-6">
            <div>
              <h2 className="font-medium">Your information</h2>
              <Label htmlFor="co-email" className="mt-4 block text-xs uppercase tracking-wider">Email address</Label>
              <Input id="co-email" value={user.email} readOnly className="mt-2 rounded-none bg-muted" />
            </div>
            <fieldset className="border-t border-border pt-6">
              <legend className="font-medium">How would you like to get it?</legend>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {options.map((o) => (
                  <label key={o.id} className="flex cursor-pointer gap-3 text-sm">
                    <input type="radio" name="fulfillment" className="mt-1 accent-foreground" checked={fulfillment === o.id} onChange={() => setFulfillment(o.id)} />
                    <span>
                      <span className="font-medium">{o.label}</span>
                      <span className="mt-0.5 block text-muted-foreground">{o.text}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            {fulfillment === "DELIVERY" && (
              <div className="space-y-4 border-t border-border pt-6">
                <h2 className="font-medium">Delivery information</h2>
                <DeliveryChoice settings={commerce} value={pick} onChange={setPick} labelClassName="text-xs uppercase tracking-wider" />
                <div>
                  <Label htmlFor="co-phone" className="text-xs uppercase tracking-wider">Phone *</Label>
                  <Input id="co-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 rounded-none" />
                </div>
                <div>
                  <Label htmlFor="co-address" className="text-xs uppercase tracking-wider">Address *</Label>
                  <Textarea id="co-address" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House number, street, area and a nearby landmark" className="mt-2 rounded-none" />
                </div>
                <div>
                  <Label htmlFor="co-note" className="text-xs uppercase tracking-wider">Note for the rider (optional)</Label>
                  <Input id="co-note" maxLength={300} value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} placeholder="e.g. Call when you reach the gate" className="mt-2 rounded-none" />
                </div>
                <button type="button" onClick={useMyLocation} disabled={locating} className="flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-2 hover:underline">
                  {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" aria-hidden />}
                  Use my current location
                </button>
                {mapQuery && (
                  <iframe
                    title="Map of your delivery address"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-64 w-full border border-border"
                  />
                )}
              </div>
            )}
            <button type="button" className={cn(SHOP_CTA, "w-full")} disabled={busy || isLoading} onClick={proceed}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Proceed to payment
            </button>
          </div>

          <aside className="border border-border lg:sticky lg:top-24">
            <div className="bg-secondary p-5">
              <h2 className="text-xl font-semibold">Order summary</h2>
              <p className="text-sm text-muted-foreground">{items.reduce((n, i) => n + i.quantity, 0)} items</p>
            </div>
            <ul className="divide-y divide-border">
              {items.map((i) => (
                <li key={`${i.product_id}:${i.size}:${i.color}`} className="flex gap-3 p-4 text-sm">
                  <div className="h-16 w-14 shrink-0 overflow-hidden bg-muted">
                    {i.image_url && <img src={i.image_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{i.name}</p>
                    <p className="text-muted-foreground">Qty: {i.quantity}{i.size && ` · Size ${i.size}`}{i.color && ` · ${i.color}`}</p>
                    <p className="tabular-nums">{GHS(i.line_total)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-border p-5"><CouponBox subtotal={subtotal} onChange={setCoupon} /></div>
            <div className="border-t border-border p-5">
              {giftCard ? (
                <p className="flex items-center justify-between text-sm">
                  <span>Gift card <span className="font-medium">{giftCard.code}</span> ({GHS(giftCard.balance)} left)</span>
                  <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setGiftCard(null)}>Remove</button>
                </p>
              ) : (
                <div className="flex gap-2">
                  <Input value={giftInput} onChange={(e) => setGiftInput(e.target.value.toUpperCase())} placeholder="Gift card code" aria-label="Gift card code" />
                  <Button type="button" variant="outline" disabled={!giftInput.trim() || checkGift.isPending} onClick={() => checkGift.mutate()}>Apply</Button>
                </div>
              )}
            </div>
            <div className="space-y-2 border-t border-border p-5 text-sm">
              <p className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{GHS(subtotal)}</span></p>
              {coupon && <p className="flex justify-between"><span>Discount</span><span className="tabular-nums">-{GHS(coupon.discount)}</span></p>}
              <p className="flex justify-between"><span>Delivery</span><span className="tabular-nums">{deliveryFee > 0 ? GHS(deliveryFee) : "Free"}</span></p>
              {giftCard && <p className="flex justify-between"><span>Gift card</span><span className="tabular-nums">-{GHS(giftCardCovers)}</span></p>}
              {processingFee > 0 && (
                <p className="flex justify-between text-muted-foreground"><span>Payment processing fee</span><span className="tabular-nums">{GHS(processingFee)}</span></p>
              )}
              <p className="flex justify-between pt-1 text-xl font-semibold"><span>Total</span><span className="tabular-nums">{GHS(total + processingFee)}</span></p>
            </div>
          </aside>
        </div>
      </section>
      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        target={paymentTarget}
        title="Pay for your order"
        onSuccess={(reference) => navigate(`/order/callback?reference=${encodeURIComponent(reference)}`)}
      />
    </Layout>
  );
};

export default Checkout;
