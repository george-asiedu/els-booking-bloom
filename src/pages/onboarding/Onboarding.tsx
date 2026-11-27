import { useEffect, useRef, useState } from "react";
import { ShopCategoryPicker, StudioTypePicker } from "@/components/ShopCategoryPicker";
import type { StudioType } from "@/lib/studioTemplates";
import { passwordChecks } from "@/lib/passwordPolicy";
import { type ShopCategoryId } from "@/lib/shopCategories";
import { SignupSuccess } from "@/components/onboarding/SignupSuccess";
import { PROCESSING, useProcessing } from "@/components/ProcessingOverlay";
import { Link, useSearchParams } from "react-router-dom";
import { openPaystackCheckout } from "@/lib/paystackCheckout";
import {
  Check,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PLATFORM, PLANS, planPrice, productOf } from "@/config/platform";
import { BrandLogo } from "@/components/BrandLogo";
import { subscriptionSetup } from "@/lib/setupFee";
import {
  onboardingApi,
  type SignupSummary,
  Plan,
  Cadence,
  BillingMode,
  OnboardingConfig,
} from "@/lib/onboardingApi";
import { useToast } from "@/hooks/use-toast";
import { studioStore } from "@/lib/apiClient";
import { formatGHS } from "@/lib/currency";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

const GHS = formatGHS;

const Onboarding = () => {
  const [params] = useSearchParams();
  const { toast } = useToast();
  const processing = useProcessing();

  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState<Plan>(() => {
    const p = params.get("plan");
    return p === "PREMIUM" || p === "STOREFRONT" ? p : "STANDARD";
  });
  // What the shop will sell: picks the shop website's design (Premium's shop
  // and Storefront; required for Storefront).
  // Everything the shop sells; the first is the main one (sets the design).
  const [shopCategories, setShopCategories] = useState<ShopCategoryId[]>([]);
  // Kinds of studio (booking plans); the first sets the website's wording.
  const [studioTypes, setStudioTypes] = useState<StudioType[]>([]);
  const product = productOf(plan);
  const sellsProducts = plan !== "STANDARD";
  const [cadence, setCadence] = useState<Cadence>(
    params.get("cadence") === "YEARLY" ? "YEARLY" : "MONTHLY",
  );
  const [billingMode, setBillingMode] = useState<BillingMode>("SUBSCRIPTION");
  const [cfg, setCfg] = useState<OnboardingConfig | null>(null);

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; percent: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const checkPromo = async () => {
    setPromoError(null);
    try {
      setPromo(await onboardingApi.checkPromo(promoInput.trim(), plan));
    } catch (err) {
      setPromo(null);
      setPromoError(err instanceof Error && err.message ? err.message : "We couldn't check that code. Please try again.");
    }
  };
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const [emailToken, setEmailToken] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [slugState, setSlugState] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [slugReason, setSlugReason] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [reference, setReference] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState<SignupSummary | null>(null);
  const [studioSlug, setStudioSlug] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedPlan = PLANS.find((p) => p.id === plan)!;
  const price = planPrice(selectedPlan, cadence);

  // Revenue-share economics for the selected plan (only when enabled).
  const commissionPct =
    plan === "PREMIUM"
      ? cfg?.commissionPremiumPercent ?? 0
      : plan === "STOREFRONT"
        ? cfg?.commissionStorefrontPercent ?? 0
        : cfg?.commissionStandardPercent ?? 0;
  const setupFee =
    plan === "PREMIUM"
      ? cfg?.setupFeePremium ?? 0
      : plan === "STOREFRONT"
        ? cfg?.setupFeeStorefront ?? 0
        : cfg?.setupFeeStandard ?? 0;
  const revShare = billingMode === "REVENUE_SHARE";
  // Subscription setup fee for the selected plan, when the platform sets one.
  const subSetup = revShare ? null : subscriptionSetup(cfg, plan, cadence);
  const per = cadence === "MONTHLY" ? "month" : "year";
  // Amount charged now: the activation fee (revenue-share), or the first
  // period's price plus the one-time setup fee (subscription).
  const setupNow = subSetup ? subSetup.fee : 0;
  const dueToday = revShare ? setupFee : price + setupNow;
  // Welcome discount (set by the super admin): off the plan price for the first
  // months, subscription plans only. It never applies to the setup fee. A promo
  // code and the welcome discount don't stack: the bigger one is used.
  const welcomePct = !revShare ? cfg?.newStudioDiscountPercent ?? 0 : 0;
  const welcomeMonths = cfg?.newStudioDiscountMonths ?? 0;
  const dueTodayPct = revShare ? promo?.percent ?? 0 : Math.max(promo?.percent ?? 0, welcomePct);
  const dueTodayAfter =
    Math.round((revShare ? setupFee : price) * (1 - dueTodayPct / 100) * 100) / 100 + setupNow;

  // Load the platform billing config so we know whether to offer revenue-share.
  useEffect(() => {
    onboardingApi
      .config()
      .then(setCfg)
      .catch(() => setCfg(null));
  }, []);

  // If the super admin disables revenue-share, fall back to subscription.
  useEffect(() => {
    if (cfg && !cfg.revenueShareEnabled && billingMode === "REVENUE_SHARE") {
      setBillingMode("SUBSCRIPTION");
    }
  }, [cfg, billingMode]);

  // Live slug availability (debounced).
  useEffect(() => {
    if (!slug || slug.length < 2) {
      setSlugState("idle");
      return;
    }
    setSlugState("checking");
    const t = setTimeout(async () => {
      try {
        const res = await onboardingApi.availability(slug);
        setSlugState(res.available ? "available" : "taken");
        setSlugReason(res.reason ?? null);
      } catch {
        setSlugState("idle");
      }
    }, 450);
    return () => clearTimeout(t);
  }, [slug]);

  // If Paystack redirected back here (hosted-checkout fallback) with a
  // reference, resume at the provisioning step and poll.
  useEffect(() => {
    const ref = params.get("reference");
    if (ref) {
      setReference(ref);
      setStep(4);
      startPolling(ref);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPolling = (ref: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await onboardingApi.status(ref);
        if (res.status === "PROVISIONED") {
          if (pollRef.current) clearInterval(pollRef.current);
          setStudioSlug(res.slug ?? slug);
          setSummary(res.summary ?? null);
          setDone(true);
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
  };

  // Password rules — kept in step with the backend so an owner can sign in
  // right after onboarding.
  const pwChecks = passwordChecks(password);
  const passwordValid = Object.values(pwChecks).every(Boolean);
  const detailsValid =
    name.trim().length >= 2 &&
    slugState === "available" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    passwordValid;

  // Email check between the details and payment. A confirmed address stays
  // confirmed unless the owner changes it.
  const sendCode = async () => {
    setCodeBusy(true);
    try {
      await onboardingApi.sendEmailCode(email.trim());
      setCodeSentTo(email.trim().toLowerCase());
      setCode("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "We couldn't send the code",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setCodeBusy(false);
    }
  };
  const continueFromDetails = () => {
    if (emailToken && verifiedEmail === email.trim().toLowerCase()) setStep(3);
    else void sendCode();
  };
  const confirmCode = async () => {
    setCodeBusy(true);
    try {
      const token = await onboardingApi.confirmEmailCode(email.trim(), code);
      setEmailToken(token);
      setVerifiedEmail(email.trim().toLowerCase());
      setCodeSentTo(null);
      setStep(3);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Code not accepted",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setCodeBusy(false);
    }
  };

  const pay = async () => {
    setSubmitting(true);
    processing.show(PROCESSING.creatingStudio);
    try {
      const res = await onboardingApi.start({
        name: name.trim(),
        slug,
        ownerEmail: email.trim(),
        emailToken,
        promoCode: promo?.code ?? undefined,
        ...(params.get("ref") ? { ref: params.get("ref")! } : {}),
        ownerPassword: password,
        ownerFullName: fullName.trim() || undefined,
        plan,
        cadence,
        billingMode,
        ...(sellsProducts && shopCategories.length
          ? { shopCategory: shopCategories[0], shopCategories }
          : {}),
        ...(plan !== "STOREFRONT" && studioTypes.length ? { studioTypes } : {}),
      });
      setReference(res.reference);

      // Free revenue-share signup (no setup fee) — provisioned immediately.
      if (res.provisioned) {
        setStudioSlug(res.slug ?? slug);
        // The studio exists already; fetch its summary for the welcome screen.
        const ready = await onboardingApi.status(res.reference).catch(() => null);
        setSummary(ready?.summary ?? null);
        setDone(true);
        return;
      }
      if (!res.accessCode) {
        throw new Error("Couldn't start checkout. Please try again.");
      }

      processing.hide();
      // A popup error is a failed payment, not a failure to start checkout.
      const result = await openPaystackCheckout(res.accessCode).catch((err: unknown) => {
        toast({
          variant: "destructive",
          title: "Payment failed",
          description: err instanceof Error && err.message ? err.message : "Please try again.",
        });
        return null;
      });
      if (result === "paid") {
        setStep(4);
        startPolling(res.reference);
      } else if (result === "cancelled") {
        toast({
          variant: "destructive",
          title: "Payment cancelled",
          description: "You can try again when you're ready.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn't start checkout",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      processing.hide();
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo />
          </Link>
          <Link to="/studio-login" className="text-sm text-muted-foreground hover:text-foreground">
            Studio login
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-10">
        {/* Progress */}
        {!done && (
          <div className="mb-8 flex items-center justify-center gap-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-2 w-16 rounded-full ${
                  step >= n ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        )}

        {done ? (
          <SignupSuccess
            summary={summary}
            // Without the summary, pick the studio in this browser instead
            // (email is unique per studio, so sign-in needs to know which).
            onOpenDashboard={() => {
              studioStore.setSlug(studioSlug);
              window.location.href = "/admin/login";
            }}
            onOpenSite={() => {
              window.location.href = `/s/${studioSlug}`;
            }}
          />
        ) : step === 1 ? (
          <div className="rounded-2xl border border-border bg-card p-8">
            <h1 className="mb-1 font-serif text-2xl font-bold">What are you setting up?</h1>
            <p className="mb-5 text-sm text-muted-foreground">
              A booking website for your beauty business, or an online shop for anything you sell.
            </p>
            {/* Product: Zuri (booking) or Zuri Stores (a shop alone). */}
            <div className="mb-8 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Product">
              {([
                ["studio", "Zuri Studios", "Bookings, payments and a website for your beauty business. Add a shop with Premium.", "STANDARD"],
                ["storefront", "Zuri Stores", "An online shop of your own, for clothes, food, perfume or anything else you sell.", "STOREFRONT"],
              ] as const).map(([id, title, text, first]) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={product === id}
                  onClick={() => product !== id && setPlan(first)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    product === id ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="font-semibold">{title}</span>
                  <p className="mt-1 text-xs text-muted-foreground">{text}</p>
                </button>
              ))}
            </div>
            <h2 className="mb-3 font-semibold">Choose your plan</h2>
            <div className="mb-6 inline-flex rounded-full border border-border p-1">
              {(["MONTHLY", "YEARLY"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCadence(c)}
                  className={`rounded-full px-5 py-1.5 text-sm font-medium ${
                    cadence === c ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {c === "MONTHLY" ? "Monthly" : "Yearly"}
                </button>
              ))}
            </div>
            <div className={`grid gap-4 ${product === "studio" ? "sm:grid-cols-2" : "max-w-md"}`}>
              {PLANS.filter((p) => p.product === product).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className={`relative flex flex-col justify-start rounded-xl border p-5 text-left transition-colors ${
                    plan === p.id
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {p.featured && (
                    <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      Adds the online shop
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{p.name}</span>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        plan === p.id ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      }`}
                    >
                      {plan === p.id && <Check className="h-3 w-3" />}
                    </span>
                  </div>
                  <div className="mt-2 font-serif text-2xl font-bold">
                    {GHS(planPrice(p, cadence))}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{cadence === "MONTHLY" ? "mo" : "yr"}
                    </span>
                  </div>
                  {(() => {
                    const s = billingMode === "SUBSCRIPTION" ? subscriptionSetup(cfg, p.id, cadence) : null;
                    return s ? (
                      <p className="mt-1 text-xs font-medium text-foreground">
                        + {GHS(s.fee)} one-time setup fee on your first payment
                      </p>
                    ) : null;
                  })()}
                  <p className="mt-1 text-xs text-muted-foreground">{p.blurb}</p>
                  <ul className="mt-4 space-y-2 border-t border-border pt-4">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
            {/* What the studio does: sets the website's wording and look. */}
            {plan !== "STOREFRONT" && (
              <div className="mt-8">
                <h2 className="mb-1 font-semibold">
                  What does your studio do? <span className="font-normal text-muted-foreground">Pick all that apply</span>
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  We'll write your website for it. You can change this later.
                </p>
                <StudioTypePicker value={studioTypes} onChange={setStudioTypes} />
              </div>
            )}
            {/* What they'll sell: sets up the shop's design. */}
            {sellsProducts && (
              <div className="mt-8">
                <h2 className="mb-1 font-semibold">
                  What will you sell? <span className="font-normal text-muted-foreground">Pick all that apply</span>
                  {plan === "PREMIUM" && <span className="font-normal text-muted-foreground"> (optional)</span>}
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  We'll set up your shop with a design made for it. You just add your products.
                </p>
                <ShopCategoryPicker value={shopCategories} onChange={setShopCategories} />
              </div>
            )}
            {/* Billing mode — only when the platform offers revenue-share. */}
            {cfg?.revenueShareEnabled && (
              <div className="mt-8">
                <h2 className="mb-1 font-semibold">How would you like to pay?</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Your plan features stay the same — this only changes how you're
                  billed.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => setBillingMode("SUBSCRIPTION")}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      billingMode === "SUBSCRIPTION"
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="font-semibold">Plan subscription</span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(() => {
                        const s = subscriptionSetup(cfg, plan, cadence);
                        return s
                          ? `${GHS(price)}/${per}, plus a one-time ${GHS(s.fee)} setup fee on your first payment.`
                          : `Pay ${GHS(price)}/${per} up front.`;
                      })()}{" "}
                      No cut of your sales.
                    </p>
                  </button>
                  <button
                    onClick={() => setBillingMode("REVENUE_SHARE")}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      billingMode === "REVENUE_SHARE"
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="font-semibold">Pay as you earn</span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {commissionPct}% per transaction
                      {setupFee > 0
                        ? `, plus a one-time ${GHS(setupFee)} activation fee.`
                        : `. No upfront plan fee.`}
                    </p>
                  </button>
                </div>
              </div>
            )}
            <div className="mt-8 flex gap-3">
              <Button variant="outline" asChild>
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Link>
              </Button>
              <Button
                className="flex-1"
                disabled={plan === "STOREFRONT" && shopCategories.length === 0}
                onClick={() => setStep(2)}
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : step === 2 ? (
          <div className="rounded-2xl border border-border bg-card p-8">
            <h1 className="mb-6 font-serif text-2xl font-bold">
              {product === "storefront" ? "Your shop details" : "Your studio details"}
            </h1>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ob-name">{product === "storefront" ? "Shop name" : "Studio name"}</Label>
                <Input
                  id="ob-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugEdited) setSlug(slugify(e.target.value));
                  }}
                  placeholder="Bella Beauty Studio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ob-slug">Your web address</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="ob-slug"
                    value={slug}
                    onChange={(e) => {
                      setSlugEdited(true);
                      setSlug(slugify(e.target.value));
                    }}
                    placeholder="bella-beauty"
                    className="font-mono"
                  />
                  {slugState === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {slugState === "available" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {slugState === "taken"
                    ? (slugReason ?? "That address is taken")
                    : `Your site: ${
                        PLATFORM.rootDomain
                          ? `${slug || "your-studio"}.${PLATFORM.rootDomain}`
                          : `/s/${slug || "your-studio"}`
                      }`}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ob-fullname">Your name</Label>
                <Input id="ob-fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ob-email">Email</Label>
                <Input id="ob-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ob-password">Create a password</Label>
                <PasswordInput id="ob-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" generate onGenerate={setPassword} />
                <p className="text-xs text-muted-foreground">You'll use this to sign in to your dashboard.</p>
                <ul className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  {[
                    { ok: pwChecks.length, label: "At least 8 characters" },
                    { ok: pwChecks.upper, label: "An uppercase letter" },
                    { ok: pwChecks.lower, label: "A lowercase letter" },
                    { ok: pwChecks.number, label: "A number" },
                    { ok: pwChecks.special, label: "A special character" },
                  ].map((c) => (
                    <li
                      key={c.label}
                      className={`flex items-center gap-1.5 ${c.ok ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      <Check className={`h-3.5 w-3.5 shrink-0 ${c.ok ? "opacity-100" : "opacity-30"}`} />
                      {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {codeSentTo === email.trim().toLowerCase() ? (
              <div className="mt-6 space-y-3 rounded-lg border p-4">
                <div>
                  <Label htmlFor="ob-code">Enter the code we emailed you</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    We sent a 6-digit code to {codeSentTo}. It expires in 15 minutes.
                  </p>
                </div>
                <Input
                  id="ob-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="font-mono tracking-widest"
                />
                <div className="flex gap-3">
                  <Button variant="outline" disabled={codeBusy} onClick={sendCode}>
                    Send a new code
                  </Button>
                  <Button className="flex-1" disabled={codeBusy || code.length !== 6} onClick={confirmCode}>
                    {codeBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm email
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-8 flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="flex-1" disabled={!detailsValid || codeBusy} onClick={continueFromDetails}>
                  {codeBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : step === 3 ? (
          <div className="rounded-2xl border border-border bg-card p-8">
            <h1 className="mb-6 font-serif text-2xl font-bold">Review & pay</h1>
            <div className="space-y-3 rounded-xl border border-border p-5">
              <Row label="Plan" value={`${selectedPlan.name} · ${cadence === "MONTHLY" ? "Monthly" : "Yearly"}`} />
              <Row
                label="Billing"
                value={
                  revShare
                    ? `Pay as you earn — ${commissionPct}% per transaction`
                    : "Plan subscription"
                }
              />
              {subSetup && (
                <>
                  <Row label={`First ${per}`} value={GHS(price)} />
                  <Row label="One-time setup fee" value={GHS(subSetup.fee)} />
                </>
              )}
              <Row label="Studio" value={name} />
              <Row label="Web address" value={`${slug}`} mono />
              <Row label="Owner" value={email} />
              <div className="flex gap-2 border-t border-border pt-3">
                <Input
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value);
                    setPromoError(null);
                  }}
                  placeholder="Promo code (optional)"
                  aria-label="Promo code"
                  className="uppercase placeholder:normal-case"
                />
                <Button type="button" variant="outline" disabled={!promoInput.trim()} onClick={checkPromo}>
                  Apply
                </Button>
              </div>
              {promo && (
                <p className="text-sm text-green-700 dark:text-green-400">
                  {promo.code}: {promo.percent}% off today's payment.
                </p>
              )}
              {promoError && (
                <p role="alert" className="flex items-start gap-1.5 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {promoError}
                </p>
              )}
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-semibold">Due today</span>
                <span className="font-serif text-xl font-bold text-primary">
                  {dueTodayPct > 0 && dueToday > 0 && (
                    <span className="mr-2 text-sm font-normal text-muted-foreground line-through">{GHS(dueToday)}</span>
                  )}
                  {GHS(dueTodayAfter)}
                  {!revShare && !subSetup && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /{cadence === "MONTHLY" ? "mo" : "yr"}
                    </span>
                  )}
                </span>
              </div>
            </div>
            {welcomePct > 0 && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
                <Gift className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <p>
                  <span className="font-semibold">Welcome offer: {welcomePct}% off your plan for your first {welcomeMonths} {welcomeMonths === 1 ? "month" : "months"}.</span>{" "}
                  {`It comes off the plan price only (not the setup fee), including your renewals within ${welcomeMonths} ${welcomeMonths === 1 ? "month" : "months"} of signing up. After that the normal price applies.`}
                </p>
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              {revShare
                ? setupFee > 0
                  ? `A one-time ${GHS(setupFee)} activation fee today, then ${commissionPct}% of each customer payment. No recurring plan fee.`
                  : `No upfront fee. The platform takes ${commissionPct}% of each customer payment.`
                : subSetup
                  ? `Today covers your first ${per} (${GHS(price)}) plus the one-time ${GHS(subSetup.fee)} setup fee, which isn't refundable. Your next renewal is ${GHS(price)}/${per} with no setup fee, from your dashboard. There are no automatic charges.`
                  : `Covers one ${per}. You'll renew from your dashboard before it ends. There are no automatic charges.`}
            </p>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 text-sm">
              <Checkbox
                checked={agreed}
                onCheckedChange={(v) => setAgreed(v === true)}
                className="mt-0.5"
                aria-required
              />
              <span>
                I have read and agree to the{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms of Service</a>{" "}
                (including how Zuri handles my customers' information for me),{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a> and{" "}
                <a href="/refunds" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Refund Policy</a>.
              </span>
            </label>
            <div className="mt-8 flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} disabled={submitting}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button className="flex-1" onClick={pay} disabled={submitting || !agreed}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {dueTodayAfter > 0
                  ? `Pay ${GHS(dueTodayAfter)} & create my studio`
                  : "Create my studio"}
              </Button>
            </div>
          </div>
        ) : (
          // Step 4 — provisioning
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
            <h1 className="font-serif text-2xl font-bold">Setting up your studio…</h1>
            <p className="mt-2 text-muted-foreground">
              We've received your payment and are creating your studio. This only
              takes a moment.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

const Row = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={mono ? "font-mono" : "font-medium"}>{value}</span>
  </div>
);

export default Onboarding;
