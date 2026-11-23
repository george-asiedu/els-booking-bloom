import { useEffect, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Gift, Loader2, Package } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/hooks/useStudio";
import { useToast } from "@/hooks/use-toast";
import { servicesApi, vouchersApi } from "@/lib/api";
import { formatGHS } from "@/lib/currency";
import { processingFeeFor } from "@/lib/fees";
import { useHideSplashWhen } from "@/lib/splash";
import { cn } from "@/lib/utils";

const AMOUNTS = [100, 200, 300, 500];

/** The studio's site or the store's, whichever this business has. */
const SiteLayout = ({ children }: { children: ReactNode }) => {
  const { features } = useStudio();
  return features.booking === false ? <ShopLayout>{children}</ShopLayout> : <Layout>{children}</Layout>;
};

/** Buy a gift card (any business) or a package of sessions (studios). */
const GiftCards = () => {
  const { name, config, features, isLoading } = useStudio();
  const { user } = useAuth();
  const { toast } = useToast();
  useHideSplashWhen(!isLoading);
  const booking = features.booking !== false;
  const { data: offers = [] } = useQuery({ queryKey: ["package-offers"], queryFn: () => vouchersApi.packages(), enabled: booking });
  const { data: services = [] } = useQuery({ queryKey: ["services"], queryFn: () => servicesApi.listActive(), enabled: booking });
  const [tab, setTab] = useState<"gift" | "package">("gift");

  const [amount, setAmount] = useState(200);
  const [custom, setCustom] = useState("");
  const [buyer, setBuyer] = useState({ name: "", email: "" });
  const [recipient, setRecipient] = useState({ name: "", email: "", message: "" });
  const [forSomeone, setForSomeone] = useState(true);
  useEffect(() => {
    if (user?.email) setBuyer((b) => ({ ...b, email: b.email || user.email }));
  }, [user]);

  const value = custom ? Number(custom) : amount;
  const fee = processingFeeFor(value || 0, config?.settings);

  const pay = (p: Promise<{ authorizationUrl: string }>) =>
    p.then((r) => {
      // Paystack's own page; it returns to /gift-cards/callback.
      window.location.href = r.authorizationUrl;
    });
  const fail = (e: unknown) => toast({ variant: "destructive", title: "Couldn't start payment", description: e instanceof Error ? e.message : undefined });
  const buyGift = useMutation({
    mutationFn: () =>
      pay(
        vouchersApi.buyGiftCard({
          amount: value,
          buyerName: buyer.name,
          buyerEmail: buyer.email,
          ...(forSomeone ? { recipientName: recipient.name, recipientEmail: recipient.email, message: recipient.message } : {}),
        }),
      ),
    onError: fail,
  });
  const buyPackage = useMutation({
    mutationFn: (packageId: string) => pay(vouchersApi.buyPackage({ packageId, buyerName: buyer.name, buyerEmail: buyer.email })),
    onError: fail,
  });

  const buyerFields = (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="buyer-name">Your name</Label>
        <Input id="buyer-name" value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="buyer-email">Your email (for the receipt)</Label>
        <Input id="buyer-email" type="email" value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} />
      </div>
    </div>
  );
  const buyerReady = buyer.name.trim() && /\S+@\S+\.\S+/.test(buyer.email);

  return (
    <SiteLayout>
      <section className="container mx-auto max-w-3xl px-4 py-12 md:py-16">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Gift cards{booking && offers.length > 0 ? " and packages" : ""}</h1>
        <p className="mt-2 text-muted-foreground">
          {booking && offers.length > 0
            ? `Give someone a treat at ${name}, or save by paying for several sessions upfront.`
            : `Give someone a treat at ${name}. They choose what to spend it on.`}
        </p>

        {booking && offers.length > 0 && (
          <div className="mt-8 flex gap-2" role="tablist">
            {(["gift", "package"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium",
                  tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50",
                )}
              >
                {t === "gift" ? <Gift className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                {t === "gift" ? "Gift card" : "Packages"}
              </button>
            ))}
          </div>
        )}

        {tab === "gift" ? (
          <form
            className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6"
            onSubmit={(e) => {
              e.preventDefault();
              buyGift.mutate();
            }}
          >
            <div>
              <Label>Amount</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setAmount(a);
                      setCustom("");
                    }}
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm font-semibold tabular-nums",
                      !custom && amount === a ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                    )}
                  >
                    {formatGHS(a)}
                  </button>
                ))}
                <Input
                  aria-label="Another amount"
                  type="number"
                  min={20}
                  max={10000}
                  placeholder="Other amount"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  className="w-36"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={forSomeone} onChange={(e) => setForSomeone(e.target.checked)} className="h-4 w-4" />
              It's a gift for someone else
            </label>
            {forSomeone && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="to-name">Their name</Label>
                    <Input id="to-name" value={recipient.name} onChange={(e) => setRecipient({ ...recipient, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="to-email">Their email</Label>
                    <Input id="to-email" type="email" value={recipient.email} onChange={(e) => setRecipient({ ...recipient, email: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to-message">A message (optional)</Label>
                  <Textarea id="to-message" rows={2} maxLength={300} value={recipient.message} onChange={(e) => setRecipient({ ...recipient, message: e.target.value })} />
                </div>
                <p className="text-xs text-muted-foreground">We'll email them the gift card code as soon as you've paid.</p>
              </div>
            )}
            {buyerFields}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                {fee > 0 ? `${formatGHS(value || 0)} + ${formatGHS(fee)} payment processing fee` : "Pay by Mobile Money or card"}
              </p>
              <Button type="submit" disabled={buyGift.isPending || !buyerReady || !(value >= 20) || (forSomeone && !/\S+@\S+\.\S+/.test(recipient.email))}>
                {buyGift.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Pay {formatGHS((value || 0) + fee)}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            {buyerFields}
            <div className="grid gap-4 sm:grid-cols-2">
              {offers.map((o) => {
                const service = services.find((s) => s.id === o.serviceId);
                const usual = service ? service.effective_price * o.sessions : null;
                return (
                  <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
                    <p className="font-semibold">{o.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {o.sessions} sessions of {service?.name ?? "this service"}
                    </p>
                    <p className="mt-3 text-2xl font-semibold tabular-nums">{formatGHS(o.price)}</p>
                    {usual && usual > o.price && (
                      <p className="text-sm text-emerald-700 dark:text-emerald-400">Save {formatGHS(usual - o.price)} on booking one at a time</p>
                    )}
                    <Button className="mt-4 w-full" disabled={!buyerReady || buyPackage.isPending} onClick={() => buyPackage.mutate(o.id)}>
                      Buy this package
                    </Button>
                  </div>
                );
              })}
            </div>
            {!buyerReady && <p className="text-sm text-muted-foreground">Enter your name and email first.</p>}
          </div>
        )}
      </section>
    </SiteLayout>
  );
};

/** Back from Paystack: confirm and say where the code went. */
export const GiftCardCallback = () => {
  const [params] = useSearchParams();
  const reference = params.get("reference") || params.get("trxref") || "";
  const { data, isLoading, isError } = useQuery({
    queryKey: ["voucher-verify", reference],
    queryFn: () => vouchersApi.verify(reference),
    enabled: !!reference,
    retry: 2,
  });
  useHideSplashWhen(!isLoading);
  const paid = data?.status === "ACTIVE" || data?.status === "USED";
  return (
    <SiteLayout>
      <section className="container mx-auto max-w-md px-4 py-20 text-center">
        {isLoading ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        ) : paid ? (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h1 className="mt-4 text-2xl font-semibold">Payment received</h1>
            <p className="mt-2 text-muted-foreground">
              {data?.kind === "PACKAGE"
                ? `Your package of ${data.sessionsTotal} sessions is ready. We've emailed the code to ${data.sentTo}.`
                : `We've emailed the gift card code to ${data?.sentTo}.`}
            </p>
            <Button asChild className="mt-6">
              <Link to="/">Back to the site</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">{isError ? "We couldn't confirm this payment" : "Payment not completed"}</h1>
            <p className="mt-2 text-muted-foreground">If money left your account, it will show here shortly. You can also try again.</p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/gift-cards">Try again</Link>
            </Button>
          </>
        )}
      </section>
    </SiteLayout>
  );
};

export default GiftCards;
