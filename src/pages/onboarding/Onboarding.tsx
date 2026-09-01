import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PaystackPop from "@paystack/inline-js";
import {
  Sparkles,
  Check,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PLATFORM, PLANS, planPrice } from "@/config/platform";
import {
  onboardingApi,
  Plan,
  Cadence,
  BillingMode,
  OnboardingConfig,
} from "@/lib/onboardingApi";
import { useToast } from "@/hooks/use-toast";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

const GHS = (n: number) => `₵${n.toLocaleString()}`;

const Onboarding = () => {
  const [params] = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState<Plan>(
    params.get("plan") === "PREMIUM" ? "PREMIUM" : "STANDARD",
  );
  const [cadence, setCadence] = useState<Cadence>(
    params.get("cadence") === "YEARLY" ? "YEARLY" : "MONTHLY",
  );
  const [billingMode, setBillingMode] = useState<BillingMode>("SUBSCRIPTION");
  const [cfg, setCfg] = useState<OnboardingConfig | null>(null);

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
  const [studioSlug, setStudioSlug] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedPlan = PLANS.find((p) => p.id === plan)!;
  const price = planPrice(selectedPlan, cadence);

  // Revenue-share economics for the selected plan (only when enabled).
  const commissionPct =
    plan === "PREMIUM"
      ? cfg?.commissionPremiumPercent ?? 0
      : cfg?.commissionStandardPercent ?? 0;
  const setupFee =
    plan === "PREMIUM" ? cfg?.setupFeePremium ?? 0 : cfg?.setupFeeStandard ?? 0;
  const revShare = billingMode === "REVENUE_SHARE";
  // Amount charged now: plan price (subscription) or one-time setup fee (rev-share).
  const dueToday = revShare ? setupFee : price;

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
          setDone(true);
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
  };

  const detailsValid =
    name.trim().length >= 2 &&
    slugState === "available" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 8;

  const pay = async () => {
    setSubmitting(true);
    try {
      const res = await onboardingApi.start({
        name: name.trim(),
        slug,
        ownerEmail: email.trim(),
        ownerPassword: password,
        ownerFullName: fullName.trim() || undefined,
        plan,
        cadence,
        billingMode,
      });
      setReference(res.reference);

      // Free revenue-share signup (no setup fee) — provisioned immediately.
      if (res.provisioned) {
        setStudioSlug(res.slug ?? slug);
        setDone(true);
        return;
      }
      if (!res.accessCode) {
        throw new Error("Couldn't start checkout. Please try again.");
      }

      const popup = new PaystackPop();
      popup.resumeTransaction(res.accessCode, {
        onSuccess: () => {
          setStep(4);
          startPolling(res.reference);
        },
        onCancel: () =>
          toast({
            variant: "destructive",
            title: "Payment cancelled",
            description: "You can try again when you're ready.",
          }),
        onError: (err: { message?: string }) =>
          toast({
            variant: "destructive",
            title: "Payment failed",
            description: err?.message || "Please try again.",
          }),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn't start checkout",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-serif text-xl font-semibold">{PLATFORM.name}</span>
          </Link>
          <Link to="/admin/login" className="text-sm text-muted-foreground hover:text-foreground">
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
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <PartyPopper className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h1 className="font-serif text-2xl font-bold">Your studio is live!</h1>
            <p className="mt-2 text-muted-foreground">
              Welcome to {PLATFORM.name}. Sign in with the email and password you
              just set to finish setting up.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild>
                <Link to="/admin/login">Go to your dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/s/${studioSlug}`}>View your site</Link>
              </Button>
            </div>
          </div>
        ) : step === 1 ? (
          <div className="rounded-2xl border border-border bg-card p-8">
            <h1 className="mb-1 font-serif text-2xl font-bold">Choose your plan</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Booking is always included. Add the online shop with Premium.
            </p>
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
            <div className="grid gap-4 sm:grid-cols-2">
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className={`relative rounded-xl border p-5 text-left transition-colors ${
                    plan === p.id
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {p.featured && (
                    <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      Most popular
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
                      Pay {GHS(price)}/{cadence === "MONTHLY" ? "mo" : "yr"} up front.
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
                        ? `, plus a one-time ${GHS(setupFee)} setup fee.`
                        : `. No upfront plan fee.`}
                    </p>
                  </button>
                </div>
              </div>
            )}
            <Button className="mt-8 w-full" onClick={() => setStep(2)}>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : step === 2 ? (
          <div className="rounded-2xl border border-border bg-card p-8">
            <h1 className="mb-6 font-serif text-2xl font-bold">Your studio details</h1>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ob-name">Studio name</Label>
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
                    : `Your site: ${slug || "your-studio"}.${PLATFORM.name.toLowerCase()}.app`}
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
                <PasswordInput id="ob-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
                <p className="text-xs text-muted-foreground">You'll use this to sign in to your dashboard.</p>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button className="flex-1" disabled={!detailsValid} onClick={() => setStep(3)}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
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
              <Row label="Studio" value={name} />
              <Row label="Web address" value={`${slug}`} mono />
              <Row label="Owner" value={email} />
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-semibold">Due today</span>
                <span className="font-serif text-xl font-bold text-primary">
                  {dueToday > 0 ? GHS(dueToday) : "₵0"}
                  {!revShare && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /{cadence === "MONTHLY" ? "mo" : "yr"}
                    </span>
                  )}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {revShare
                ? setupFee > 0
                  ? `A one-time ${GHS(setupFee)} setup fee today, then ${commissionPct}% of each customer payment. No recurring plan fee.`
                  : `No upfront fee — the platform takes ${commissionPct}% of each customer payment.`
                : `Covers one ${cadence === "MONTHLY" ? "month" : "year"}. You'll renew from your dashboard before it ends — no automatic charges.`}{" "}
              By continuing you agree to our{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms</a> and{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
            <div className="mt-8 flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} disabled={submitting}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button className="flex-1" onClick={pay} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {dueToday > 0
                  ? `Pay ${GHS(dueToday)} & create my studio`
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
