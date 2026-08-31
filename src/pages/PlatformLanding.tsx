import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { platformReviewsApi } from "@/lib/api";
import {
  Sparkles,
  Calendar,
  ShoppingBag,
  Smartphone,
  Gift,
  Globe,
  LayoutDashboard,
  Star,
  Check,
  ArrowRight,
  Menu,
  X,
  MessageCircle,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Reveal } from "@/components/Reveal";
import { PLATFORM, PLANS, planPrice, studioUrl } from "@/config/platform";

const FEATURES = [
  {
    icon: Calendar,
    title: "Bookings & scheduling",
    text: "Let clients book 24/7 with availability, deposits and reminders — no more back-and-forth.",
  },
  {
    icon: Smartphone,
    title: "Mobile Money payments",
    text: "Take deposits and payments by Mobile Money or card, with money settling straight to you.",
  },
  {
    icon: ShoppingBag,
    title: "Your own online shop",
    text: "Sell products alongside services, with cart, checkout and order tracking (Premium).",
  },
  {
    icon: Gift,
    title: "Loyalty & referrals",
    text: "Reward repeat clients with points and grow by word-of-mouth with referral codes.",
  },
  {
    icon: Globe,
    title: "A branded site",
    text: "Your logo, colours and your own web address — a storefront that looks like you.",
  },
  {
    icon: LayoutDashboard,
    title: "One simple dashboard",
    text: "Appointments, orders, reviews, promotions and payouts — all in one place.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Pick your plan",
    text: "Choose Standard or Premium, monthly or yearly, and pay securely to get started.",
  },
  {
    n: "2",
    title: "Make it yours",
    text: "Add your logo and colours, list your services (and products), and set your hours.",
  },
  {
    n: "3",
    title: "Share your link",
    text: "Send clients your booking link and start taking bookings and payments the same day.",
  },
];

const FAQ = [
  {
    q: "Do I need any technical skills?",
    a: "None. You add your services, colours and logo from a simple dashboard, and your booking site is ready the same day.",
  },
  {
    q: "How do I get paid?",
    a: "Connect your Mobile Money account and customer payments settle straight to you. You can take deposits or full payment at booking.",
  },
  {
    q: "What's the difference between Standard and Premium?",
    a: "Both include bookings, payments, loyalty and your branded site. Premium adds an online shop to sell products and add them during booking.",
  },
  {
    q: "Can I cancel or change my plan?",
    a: "Yes — upgrade, downgrade or switch between monthly and yearly anytime from your dashboard. Cancel whenever you like.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes. Point your own web address (e.g. book.mystudio.com) to your studio with a quick DNS verification.",
  },
];

const GHS = (n: number) => `₵${n.toLocaleString()}`;

const PlatformLanding = () => {
  const [cadence, setCadence] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: testimonials = [] } = useQuery({
    queryKey: ["platform-testimonials"],
    queryFn: () => platformReviewsApi.listApproved(),
    staleTime: 10 * 60 * 1000,
  });

  const isWhatsapp = Boolean(PLATFORM.whatsapp);
  const contactHref = isWhatsapp
    ? `https://wa.me/${PLATFORM.whatsapp}?text=${encodeURIComponent(
        `Hi ${PLATFORM.name}, I'd like to set up my studio.`,
      )}`
    : `mailto:${PLATFORM.email}?subject=${encodeURIComponent(
        `Setting up my studio on ${PLATFORM.name}`,
      )}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-serif text-xl font-semibold">{PLATFORM.name}</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">How it works</a>
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/login">Studio login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/onboarding">Get started</Link>
            </Button>
          </nav>
          <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-border bg-background px-4 py-3 md:hidden">
            <div className="flex flex-col gap-2">
              <a href="#features" onClick={() => setMenuOpen(false)} className="py-2 text-sm">Features</a>
              <a href="#pricing" onClick={() => setMenuOpen(false)} className="py-2 text-sm">Pricing</a>
              <a href="#how" onClick={() => setMenuOpen(false)} className="py-2 text-sm">How it works</a>
              <Button variant="outline" asChild><Link to="/admin/login">Studio login</Link></Button>
              <Button asChild><Link to="/onboarding">Get started</Link></Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        {/* Floating brand blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float-slow absolute -left-20 top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="animate-float-slow absolute -right-16 top-32 h-72 w-72 rounded-full bg-accent/40 blur-3xl [animation-delay:1.5s]" />
          <div className="animate-float-slow absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-primary/10 blur-3xl [animation-delay:3s]" />
        </div>
        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="animate-fade-in mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" /> {PLATFORM.heroBadge}
            </span>
            <h1 className="animate-fade-in font-serif text-4xl font-bold leading-tight [animation-delay:100ms] md:text-6xl">
              Run and grow your <span className="text-primary">beauty business</span>
            </h1>
            <p className="animate-fade-in mx-auto mt-6 max-w-2xl text-lg text-muted-foreground [animation-delay:200ms]">
              {PLATFORM.description}
            </p>
            <div className="animate-fade-in mt-8 flex flex-col items-center justify-center gap-3 [animation-delay:300ms] sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/onboarding">
                  Start your studio <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={studioUrl(PLATFORM.demoSlug)} target="_blank" rel="noreferrer">
                  See a live studio
                </a>
              </Button>
            </div>
            <p className="animate-fade-in mt-4 text-sm text-muted-foreground [animation-delay:400ms]">
              No setup fees · Cancel anytime · Mobile Money supported
            </p>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-border bg-card">
        <div className="container mx-auto grid grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
          {[
            { k: "10 min", v: "to set up" },
            { k: "0%", v: "setup fee" },
            { k: "24/7", v: "online bookings" },
            { k: "MoMo", v: "+ card payments" },
          ].map((s, i) => (
            <Reveal key={s.v} delay={i * 80} className="text-center">
              <div className="font-serif text-3xl font-bold text-primary md:text-4xl">
                {s.k}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.v}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-bold md:text-4xl">Everything in one place</h2>
            <p className="mt-3 text-muted-foreground">
              Stop juggling WhatsApp, notebooks and spreadsheets. {PLATFORM.name} brings your whole studio together.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal
                key={f.title}
                delay={(i % 3) * 90}
                className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent transition-transform duration-300 group-hover:scale-110">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <Reveal>
            <h2 className="font-serif text-2xl font-bold md:text-3xl">
              Built for every kind of studio
            </h2>
            <p className="mt-2 text-muted-foreground">
              Nails · Lashes · Hair & braids · Makeup · Spa & skincare · Barbering
            </p>
          </Reveal>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              "Nail techs",
              "Lash artists",
              "Hair stylists",
              "Braiders",
              "Makeup artists",
              "Spas",
              "Barbers",
              "Home studios",
            ].map((w, i) => (
              <Reveal key={w} delay={i * 50}>
                <span className="rounded-full border border-border bg-card px-4 py-2 text-sm">
                  {w}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-secondary py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-bold md:text-4xl">Live in a day</h2>
            <p className="mt-3 text-muted-foreground">Three simple steps from sign-up to your first booking.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 120} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/30">
                  {s.n}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-bold md:text-4xl">Simple, transparent pricing</h2>
            <p className="mt-3 text-muted-foreground">Booking is always included. Add the online shop with Premium.</p>
            <div className="mt-6 inline-flex rounded-full border border-border bg-card p-1">
              {(["MONTHLY", "YEARLY"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCadence(c)}
                  className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
                    cadence === c ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {c === "MONTHLY" ? "Monthly" : "Yearly"}
                  {c === "YEARLY" && (
                    <span className="ml-1 text-xs opacity-80">save 2 months</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border bg-card p-8 ${
                  plan.featured ? "border-primary shadow-lg ring-1 ring-primary/20" : "border-border"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="font-serif text-4xl font-bold">
                    {GHS(planPrice(plan, cadence))}
                  </span>
                  <span className="mb-1 text-sm text-muted-foreground">
                    /{cadence === "MONTHLY" ? "month" : "year"}
                  </span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 w-full"
                  variant={plan.featured ? "default" : "outline"}
                  asChild
                >
                  <Link to={`/onboarding?plan=${plan.id}&cadence=${cadence}`}>
                    Get started with {plan.name}
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center text-sm text-muted-foreground">
            Not ready yet?{" "}
            <a
              href={contactHref}
              target={isWhatsapp ? "_blank" : undefined}
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Talk to us
            </a>{" "}
            and we'll help you get set up.
          </p>
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-secondary py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center font-serif text-3xl font-bold md:text-4xl">
            Loved by studios
          </h2>
          {testimonials.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.slice(0, 6).map((t) => (
                <div key={t.id} className="rounded-2xl border border-border bg-card p-6">
                  <div className="mb-3 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < t.rating
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm">“{t.content}”</p>
                  <p className="mt-4 text-sm font-medium">
                    {t.authorName}
                    {t.authorRole ? (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {t.authorRole}
                      </span>
                    ) : null}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
              <div className="mb-4 flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="text-lg font-medium">
                “{PLATFORM.name} put my whole studio online in a day. My clients
                book and pay themselves now — I just show up and do the work.”
              </p>
              <p className="mt-4 text-sm text-muted-foreground">A happy studio owner</p>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <Reveal>
            <h2 className="mb-10 text-center font-serif text-3xl font-bold md:text-4xl">
              Frequently asked questions
            </h2>
          </Reveal>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <Reveal
                key={item.q}
                delay={i * 60}
                className="rounded-xl border border-border bg-card p-5"
              >
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl rounded-3xl bg-primary p-10 text-center md:p-16">
            <h2 className="font-serif text-3xl font-bold text-primary-foreground md:text-4xl">
              Ready to grow your studio?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Join {PLATFORM.name} today and take bookings, payments and orders from one branded site.
            </p>
            <Button size="lg" variant="secondary" className="mt-8" asChild>
              <Link to="/onboarding">
                Start your studio <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-serif text-lg font-semibold">{PLATFORM.name}</span>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link to="/admin/login" className="hover:text-foreground">Studio login</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <a href={`mailto:${PLATFORM.email}`} className="flex items-center gap-1 hover:text-foreground">
              <Mail className="h-4 w-4" /> {PLATFORM.email}
            </a>
            {PLATFORM.whatsapp && (
              <a href={`https://wa.me/${PLATFORM.whatsapp}`} className="flex items-center gap-1 hover:text-foreground">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {PLATFORM.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PlatformLanding;
