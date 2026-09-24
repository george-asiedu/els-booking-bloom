import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { platformReviewsApi } from "@/lib/api";
import {
  Calendar,
  ShoppingBag,
  Smartphone,
  Gift,
  Star,
  Check,
  ArrowRight,
  Menu,
  X,
  Mail,
  Sparkles,
  Upload,
  MessageSquareQuote,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Reveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";
import { BrandLogo } from "@/components/BrandLogo";
import { WhatsappIcon } from "@/components/icons/WhatsappIcon";
import { PLATFORM, PLANS, planPrice, studioUrl } from "@/config/platform";
import { cn } from "@/lib/utils";
import nails1 from "@/assets/gallery/nails-1.jpg";
import nails2 from "@/assets/gallery/nails-2.jpg";
import lashes1 from "@/assets/gallery/lashes-1.jpg";
import lashes2 from "@/assets/gallery/lashes-2.jpg";
import { formatGHS } from "@/lib/currency";

const GHS = formatGHS;

// ---- Sample studios for the multi-tenant showcase (presentational only) ----
interface DemoStudio {
  key: string;
  name: string;
  slug: string;
  accent: string; // raw HSL channels, e.g. "340 45% 55%"
  tags: string[];
  featured: { name: string; price: number; duration: string };
  gallery: string[];
}

const STUDIOS: DemoStudio[] = [
  {
    key: "els",
    name: "El's Beauty Studio",
    slug: "elsbeautystudio",
    accent: "340 45% 55%",
    tags: ["Nails", "Lashes", "Braids", "Facials"],
    featured: { name: "Gel Extensions", price: 180, duration: "60 min" },
    gallery: [nails1, lashes1, nails2],
  },
  {
    key: "zara",
    name: "Nailed by Zara",
    slug: "nailedbyzara",
    accent: "286 34% 52%",
    tags: ["Acrylics", "Gel", "Nail art", "Pedicure"],
    featured: { name: "Full Set Acrylics", price: 160, duration: "75 min" },
    gallery: [nails2, nails1, lashes2],
  },
  {
    key: "ama",
    name: "Glow by Ama",
    slug: "glowbyama",
    accent: "18 58% 52%",
    tags: ["Facials", "Makeup", "Waxing", "Brows"],
    featured: { name: "Glow Facial", price: 220, duration: "50 min" },
    gallery: [lashes1, lashes2, nails1],
  },
];

const FEATURES = [
  {
    icon: Calendar,
    title: "Bookings",
    text: "Let clients discover your services and book anytime — with availability, deposits and reminders built in.",
  },
  {
    icon: Smartphone,
    title: "Payments",
    text: "Accept Mobile Money and card payments, with money settling straight to your own account.",
  },
  {
    icon: ShoppingBag,
    title: "Products",
    text: "Sell products directly from your branded storefront, with cart, checkout and orders.",
  },
  {
    icon: Gift,
    title: "Loyalty",
    text: "Reward repeat clients with points and referrals — give them a reason to come back.",
  },
  {
    icon: Star,
    title: "Reviews",
    text: "Build trust with real customer experiences shown right on your storefront.",
  },
];

const JOURNEY = [
  { n: "01", title: "Discover", text: "A client discovers your studio online — on your own branded link." },
  { n: "02", title: "Book", text: "They choose a service, date and time in a few taps." },
  { n: "03", title: "Pay", text: "They pay securely with Mobile Money or card." },
  { n: "04", title: "Return", text: "They leave a review and earn loyalty points." },
  { n: "05", title: "Repeat", text: "They come back — and become a loyal, paying regular." },
];

const FAQ = [
  {
    q: "Do I need any technical skills?",
    a: "None. You add your services, colours and logo from a simple dashboard, and your booking site is ready the same day.",
  },
  {
    q: "How do I get paid?",
    a: "Connect your Mobile Money or bank account and customer payments settle straight to you. Take deposits or full payment at booking.",
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
    a: "Yes. Point your own web address to your studio with a quick DNS verification.",
  },
];

// ---------------------------------------------------------------------------
// Presentational storefront mockup (used in the hero + the studio showcase)
// ---------------------------------------------------------------------------
const StorefrontMockup = ({
  studio,
  className,
}: {
  studio: DemoStudio;
  className?: string;
}) => {
  const brand = `hsl(${studio.accent})`;
  const brandSoft = `hsl(${studio.accent} / 0.12)`;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-xl",
        className,
      )}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-gold/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/40" />
        <div className="ml-2 flex-1 truncate rounded-md bg-background/80 px-3 py-1 text-center text-xs text-muted-foreground">
          {studio.slug}.zuristudios.com
        </div>
      </div>

      <div className="p-5">
        {/* Studio header */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-serif text-lg font-bold text-white"
            style={{ backgroundColor: brand }}
          >
            {studio.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-serif text-base font-semibold leading-tight">
              {studio.name}
            </p>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <span className="flex" style={{ color: "hsl(var(--gold))" }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-current" />
                ))}
              </span>
              4.9 · 214 reviews
            </div>
          </div>
        </div>

        {/* Service chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {studio.tags.map((t, i) => (
            <span
              key={t}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={
                i === 0
                  ? { backgroundColor: brand, color: "#fff" }
                  : { backgroundColor: brandSoft, color: brand }
              }
            >
              {t}
            </span>
          ))}
        </div>

        {/* Featured service */}
        <div className="mt-4 rounded-xl border border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Featured
              </p>
              <p className="mt-0.5 font-semibold">{studio.featured.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {GHS(studio.featured.price)} · {studio.featured.duration}
              </p>
            </div>
          </div>
          <button
            className="mt-3 w-full rounded-lg py-2 text-sm font-semibold text-white transition-transform duration-200 hover:brightness-105"
            style={{ backgroundColor: brand }}
          >
            Book appointment
          </button>
        </div>

        {/* Gallery */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {studio.gallery.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              loading="lazy"
              className="aspect-square w-full rounded-lg object-cover"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// A small floating status card that drifts gently around the hero mockup.
const FloatCard = ({
  className,
  delay = 0,
  children,
}: {
  className?: string;
  delay?: number;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      "animate-float-card absolute z-10 flex items-center gap-2 rounded-xl border border-border bg-card/95 px-3 py-2 text-xs font-medium shadow-lg backdrop-blur",
      className,
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

// A progress bar that fills from 0 to `pct`% once scrolled into view.
const Bar = ({ pct, className }: { pct: number; className?: string }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-out motion-reduce:transition-none"
        style={{ width: on ? `${Math.min(100, pct)}%` : "0%" }}
      />
    </div>
  );
};

const PlatformLanding = () => {
  const [cadence, setCadence] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeStudio, setActiveStudio] = useState(0);

  const { data: testimonials = [] } = useQuery({
    queryKey: ["platform-testimonials"],
    queryFn: () => platformReviewsApi.listApproved(),
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isWhatsapp = Boolean(PLATFORM.whatsapp);
  const contactHref = isWhatsapp
    ? `https://wa.me/${PLATFORM.whatsapp}?text=${encodeURIComponent(
        `Hi ${PLATFORM.name}, I'd like to set up my studio.`,
      )}`
    : `mailto:${PLATFORM.email}?subject=${encodeURIComponent(
        `Setting up my studio on ${PLATFORM.name}`,
      )}`;

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
    { href: "#for-studios", label: "For studios" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------------------------------------------------------------- Nav */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-border bg-background/80 py-2 shadow-sm backdrop-blur-xl"
            : "border-b border-transparent bg-background/40 py-4 backdrop-blur-sm",
        )}
      >
        <div className="container mx-auto flex items-center justify-between px-4">
          <Link to="/" className="animate-fade-in">
            <BrandLogo />
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group relative text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/login">Studio login</Link>
            </Button>
            <Button size="sm" className="group" asChild>
              <Link to="/onboarding">
                Get started
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </nav>
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="p-1"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-border bg-background px-4 py-4 md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-2 py-2.5 text-sm hover:bg-secondary"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                <Button variant="outline" asChild>
                  <Link to="/admin/login">Studio login</Link>
                </Button>
                <Button asChild>
                  <Link to="/onboarding">Get started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* --------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden pt-28 md:pt-36">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="animate-float-slow absolute -left-24 top-4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="animate-float-slow absolute -right-20 top-24 h-80 w-80 rounded-full bg-accent/50 blur-3xl [animation-delay:1.5s]" />
          <div className="animate-float-slow absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-primary/10 blur-3xl [animation-delay:3s]" />
        </div>

        <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 py-12 lg:grid-cols-2 lg:gap-8 lg:py-20">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <span className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" /> {PLATFORM.heroBadge}
            </span>
            <h1 className="animate-fade-in font-serif text-4xl font-bold leading-[1.08] [animation-delay:100ms] sm:text-5xl md:text-6xl">
              Your beauty business,
              <br className="hidden sm:block" />{" "}
              <span className="text-primary">beautifully online.</span>
            </h1>
            <p className="animate-fade-in mx-auto mt-6 max-w-xl text-lg text-muted-foreground [animation-delay:200ms] lg:mx-0">
              Zuri gives beauty studios one beautiful place to take bookings, sell
              products, accept payments, reward loyal clients, and grow.
            </p>
            <div className="animate-fade-in mt-8 flex flex-col items-center gap-3 [animation-delay:300ms] sm:flex-row sm:justify-center lg:justify-start">
              <Button size="lg" className="group w-full sm:w-auto" asChild>
                <Link to="/onboarding">
                  Start your studio
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <a href={studioUrl(PLATFORM.demoSlug)} target="_blank" rel="noreferrer">
                  Explore a live studio
                </a>
              </Button>
            </div>
            <p className="animate-fade-in mt-5 text-sm text-muted-foreground [animation-delay:400ms]">
              No setup fees · 10-minute setup · Mobile Money + card payments
            </p>
          </div>

          {/* Product showcase */}
          <div className="animate-fade-in relative mx-auto w-full max-w-md [animation-delay:400ms] lg:max-w-none">
            <StorefrontMockup studio={STUDIOS[0]} />
            <FloatCard className="-left-4 top-8 sm:-left-8" delay={0}>
              <Calendar className="h-4 w-4 text-primary" /> New booking
            </FloatCard>
            <FloatCard className="-right-3 top-28 sm:-right-6" delay={700}>
              <Check className="h-4 w-4 text-green-600" /> Payment received · GHS 180
            </FloatCard>
            <FloatCard className="-left-3 bottom-24 sm:-left-6" delay={1400}>
              <Gift className="h-4 w-4 text-primary" /> +50 loyalty points
            </FloatCard>
            <FloatCard className="-right-2 bottom-6 sm:-right-5" delay={2100}>
              <span className="flex" style={{ color: "hsl(var(--gold))" }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-current" />
                ))}
              </span>
              New review
            </FloatCard>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Trust strip */}
      <section className="border-y border-border bg-card">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-10 md:grid-cols-4 md:gap-6">
          {[
            { node: <CountUp value={10} suffix=" min" />, label: "Setup time" },
            { node: <CountUp value={0} suffix="%" />, label: "Setup fees" },
            { node: "24/7", label: "Online bookings" },
            { node: "MoMo + Cards", label: "Payments made simple" },
          ].map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 80}
              className="rounded-2xl border border-border bg-background/50 p-5 text-center"
            >
              <div className="font-serif text-3xl font-bold text-primary md:text-4xl">
                {s.node}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <Reveal>
              <h2 className="font-serif text-3xl font-bold leading-tight md:text-5xl">
                Everything your beauty business needs.
                <br className="hidden md:block" /> In one beautiful place.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Stop juggling WhatsApp, notebooks and spreadsheets. Zuri replaces
                the lot with one branded storefront.
              </p>
            </Reveal>
          </div>

          {/* Asymmetric layout: a tall feature with a preview + a 2x2 grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Reveal className="lg:row-span-2">
              <div className="group flex h-full flex-col justify-between rounded-3xl border border-border bg-gradient-to-b from-accent/40 to-card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Bookings</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Let clients discover available services and book anytime —
                    even while you're busy making someone else beautiful.
                  </p>
                </div>
                <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Today</span>
                    <span className="text-muted-foreground">Wed 12</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {[
                      { t: "09:30", s: "Gel Extensions", on: true },
                      { t: "11:00", s: "Classic Lashes", on: true },
                      { t: "13:30", s: "Available", on: false },
                    ].map((r) => (
                      <div
                        key={r.t}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                          r.on
                            ? "border-primary/20 bg-primary/5"
                            : "border-dashed border-border text-muted-foreground",
                        )}
                      >
                        <span className="font-mono text-xs">{r.t}</span>
                        <span>{r.s}</span>
                        {r.on && (
                          <Check className="ml-auto h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            {FEATURES.slice(1).map((f, i) => (
              <Reveal
                key={f.title}
                delay={(i % 2) * 90}
                className="group rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent transition-transform duration-300 group-hover:scale-110">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------ Multi-tenant storefronts */}
      <section id="for-studios" className="bg-secondary py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <Reveal>
                <h2 className="font-serif text-3xl font-bold leading-[1.1] md:text-5xl">
                  Your business.
                  <br /> Your brand.
                  <br /> <span className="text-primary">Your storefront.</span>
                </h2>
                <p className="mt-4 max-w-md text-muted-foreground">
                  Every studio on Zuri gets its own branded storefront on its own
                  web address — your colours, your services, your gallery.
                </p>
              </Reveal>
              <div className="mt-8 space-y-3">
                {STUDIOS.map((s, i) => (
                  <Reveal key={s.key} delay={i * 80}>
                    <button
                      onClick={() => setActiveStudio(i)}
                      onMouseEnter={() => setActiveStudio(i)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300",
                        activeStudio === i
                          ? "border-primary bg-card shadow-md"
                          : "border-border bg-card/50 hover:bg-card",
                      )}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-serif font-bold text-white"
                        style={{ backgroundColor: `hsl(${s.accent})` }}
                      >
                        {s.name.charAt(0)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">
                          {s.name}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {s.slug}.zuristudios.com
                        </span>
                      </span>
                      <ArrowRight
                        className={cn(
                          "ml-auto h-4 w-4 shrink-0 transition-all",
                          activeStudio === i
                            ? "text-primary opacity-100"
                            : "opacity-0",
                        )}
                      />
                    </button>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal className="relative mx-auto w-full max-w-md">
              <StorefrontMockup
                key={STUDIOS[activeStudio].key}
                studio={STUDIOS[activeStudio]}
                className="animate-fade-in"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Customer journey */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <Reveal>
              <h2 className="font-serif text-3xl font-bold md:text-5xl">
                From discovery to loyalty
              </h2>
              <p className="mt-4 text-muted-foreground">
                Zuri carries every client through the whole journey — and brings
                them back again.
              </p>
            </Reveal>
          </div>

          <div className="relative mx-auto max-w-3xl">
            {/* Connector line */}
            <div className="absolute left-[27px] top-4 bottom-4 hidden w-px bg-gradient-to-b from-primary/60 via-primary/30 to-transparent sm:block" />
            <div className="space-y-5">
              {JOURNEY.map((step, i) => (
                <Reveal
                  key={step.n}
                  delay={i * 90}
                  className="relative flex items-start gap-5 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20">
                    {step.n}
                  </span>
                  <div className="pt-1.5">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {step.text}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Booking experience */}
      <section className="bg-secondary py-20 md:py-28">
        <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2">
          <Reveal>
            <span className="text-sm font-semibold uppercase tracking-wide text-primary">
              Booking
            </span>
            <h2 className="mt-2 font-serif text-3xl font-bold md:text-5xl">
              A booking experience clients actually enjoy.
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Let clients book you while you're busy making them beautiful. They
              even attach a design reference so you're ready before they arrive.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Pick a service, date and time in seconds",
                "Upload a design or reference photo",
                "Pay a deposit or in full at booking",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-primary" /> {t}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={100} className="mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
              <p className="font-serif text-lg font-semibold">
                Book your appointment
              </p>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Choose a service
              </p>
              <div className="mt-2 space-y-2">
                {[
                  { n: "Gel Extensions", p: 180, d: "60 min", on: true },
                  { n: "Classic Lashes", p: 150, d: "75 min", on: false },
                ].map((s) => (
                  <div
                    key={s.n}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-3 text-sm",
                      s.on
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border",
                    )}
                  >
                    <span className="font-medium">{s.n}</span>
                    <span className="text-muted-foreground">
                      {GHS(s.p)} · {s.d}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Date
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    {["11", "12", "13", "14"].map((d, i) => (
                      <span
                        key={d}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg text-sm",
                          i === 1
                            ? "bg-primary text-primary-foreground"
                            : "border border-border",
                        )}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Time
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["9:30", "11:00", "1:30"].map((t, i) => (
                      <span
                        key={t}
                        className={cn(
                          "rounded-lg px-2.5 py-1.5 text-xs",
                          i === 0
                            ? "bg-primary text-primary-foreground"
                            : "border border-border",
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
                <Upload className="h-4 w-4 text-primary" />
                Upload design reference (optional)
              </div>

              <button className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">
                Confirm booking
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------- Business side */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2">
          <Reveal delay={100} className="order-2 mx-auto w-full max-w-lg lg:order-1">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <p className="font-serif text-lg font-semibold">Today</p>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Live
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: "Today's bookings", value: 18 },
                  { label: "New clients", value: 7 },
                  { label: "Returning clients", value: 11 },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border border-border p-4">
                    <p className="font-serif text-2xl font-bold text-primary">
                      <CountUp value={m.value} />
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{m.label}</p>
                  </div>
                ))}
                <div className="rounded-xl border border-border bg-primary/5 p-4">
                  <p className="font-serif text-2xl font-bold text-primary">
                    <CountUp value={2480} prefix="GHS " />
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>

              <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Popular services
              </p>
              <div className="mt-3 space-y-2.5">
                {[
                  { n: "Gel Extensions", w: 90 },
                  { n: "Classic Lashes", w: 68 },
                  { n: "Box Braids", w: 44 },
                ].map((b) => (
                  <div key={b.n}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{b.n}</span>
                    </div>
                    <Bar pct={b.w} />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal className="order-1 lg:order-2">
            <span className="text-sm font-semibold uppercase tracking-wide text-primary">
              For studio owners
            </span>
            <h2 className="mt-2 font-serif text-3xl font-bold md:text-5xl">
              Run the business.
              <br /> Without the busywork.
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Appointments, revenue, popular services, new and returning clients,
              reviews and loyalty — all in one clear dashboard, updated live.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              {["Appointments", "Revenue", "Reviews", "Loyalty", "Analytics"].map(
                (t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5"
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-primary" /> {t}
                  </span>
                ),
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------- Loyalty + reviews */}
      <section className="bg-secondary py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <Reveal>
              <h2 className="font-serif text-3xl font-bold md:text-5xl">
                Make great clients
                <br /> want to come back.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Zuri isn't just bookings — it helps you build the long-term
                relationships that keep your chairs full.
              </p>
            </Reveal>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            <Reveal className="rounded-3xl border border-border bg-card p-7 shadow-sm">
              <MessageSquareQuote className="h-8 w-8 text-primary/40" />
              <div className="mt-4 flex" style={{ color: "hsl(var(--gold))" }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="mt-4 font-serif text-xl leading-snug">
                “Absolutely loved my nails. The booking process was so easy — and
                I earned points I actually used!”
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Ama · returning client
              </p>
            </Reveal>

            <Reveal delay={120} className="rounded-3xl border border-border bg-card p-7 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-serif text-lg font-semibold">
                  <Gift className="h-5 w-5 text-primary" /> Zuri Rewards
                </span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Gold
                </span>
              </div>
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Current points
                  </p>
                  <p className="font-serif text-4xl font-bold text-primary">
                    <CountUp value={350} />
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Next reward
                  </p>
                  <p className="font-serif text-2xl font-bold">500</p>
                </div>
              </div>
              <Bar pct={70} className="mt-4 h-2.5" />
              <p className="mt-2 text-sm text-muted-foreground">150 points to go</p>
            </Reveal>
          </div>

          {/* Real studio testimonials, if any */}
          {testimonials.length > 0 && (
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.slice(0, 3).map((t, i) => (
                <Reveal
                  key={t.id}
                  delay={i * 90}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <div className="mb-3 flex gap-1" style={{ color: "hsl(var(--gold))" }}>
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        className={cn(
                          "h-4 w-4",
                          j < t.rating ? "fill-current" : "text-muted-foreground/30",
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm">“{t.content}”</p>
                  <p className="mt-4 text-sm font-medium">
                    {t.authorName}
                    {t.authorRole ? (
                      <span className="font-normal text-muted-foreground">
                        {" "}· {t.authorRole}
                      </span>
                    ) : null}
                  </p>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------- How it works */}
      <section id="how" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <Reveal>
              <h2 className="font-serif text-3xl font-bold md:text-5xl">
                Live in a day.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Three simple steps from sign-up to your first paid booking.
              </p>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { n: "1", t: "Pick your plan", d: "Choose Standard or Premium, monthly or yearly, and set up in minutes." },
              { n: "2", t: "Make it yours", d: "Add your logo and colours, list your services and products, set your hours." },
              { n: "3", t: "Share your link", d: "Send clients your booking link and start taking bookings the same day." },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 120} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary font-serif text-xl font-bold text-primary-foreground shadow-lg shadow-primary/25">
                  {s.n}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{s.t}</h3>
                <p className="mx-auto max-w-xs text-sm text-muted-foreground">
                  {s.d}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Pricing */}
      <section id="pricing" className="bg-secondary py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <Reveal>
              <h2 className="font-serif text-3xl font-bold md:text-5xl">
                Simple pricing. No surprises.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Booking is always included. Add the online shop with Premium. No
                setup fees, cancel anytime.
              </p>
            </Reveal>
            <div className="mt-6 inline-flex rounded-full border border-border bg-card p-1">
              {(["MONTHLY", "YEARLY"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCadence(c)}
                  className={cn(
                    "rounded-full px-5 py-1.5 text-sm font-medium transition-colors",
                    cadence === c
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
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
            {PLANS.map((plan, i) => (
              <Reveal
                key={plan.id}
                delay={i * 100}
                className={cn(
                  "relative rounded-3xl border bg-card p-8 transition-all duration-300 hover:-translate-y-1",
                  plan.featured
                    ? "border-primary shadow-lg ring-1 ring-primary/20"
                    : "border-border hover:shadow-lg",
                )}
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
              </Reveal>
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

      {/* ---------------------------------------------------------------- FAQ */}
      <section className="py-20 md:py-28">
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
                className="rounded-2xl border border-border bg-card p-5"
              >
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Final CTA */}
      <section className="px-4 pb-24 pt-4">
        <div className="container relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-accent/60 via-background to-primary/10 p-10 text-center md:p-16">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="animate-float-slow absolute -left-10 -top-10 h-52 w-52 rounded-full bg-primary/15 blur-3xl" />
            <div className="animate-float-slow absolute -bottom-12 -right-8 h-56 w-56 rounded-full bg-primary/10 blur-3xl [animation-delay:2s]" />
          </div>
          <Reveal>
            <h2 className="mx-auto max-w-2xl font-serif text-3xl font-bold leading-tight md:text-5xl">
              Your next client could be
              <br className="hidden md:block" /> looking for you right now.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Give your beauty business a storefront that works as beautifully as
              you do.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="group w-full sm:w-auto" asChild>
                <Link to="/onboarding">
                  Start your studio
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <a href={studioUrl(PLATFORM.demoSlug)} target="_blank" rel="noreferrer">
                  See a live studio
                </a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
            <div className="col-span-2 md:col-span-2">
              <BrandLogo full />
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                One beautiful storefront for bookings, payments, products and
                loyal clients — built for beauty businesses.
              </p>
            </div>
            <FooterCol
              title="Product"
              links={[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "How it works", href: "#how" },
              ]}
            />
            <FooterCol
              title="Studios"
              links={[
                { label: "Studio login", to: "/admin/login" },
                { label: "Get started", to: "/onboarding" },
              ]}
            />
            <FooterCol
              title="Legal"
              links={[
                { label: "Privacy", to: "/privacy" },
                { label: "Terms", to: "/terms" },
              ]}
            />
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Zuri Studios. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a
                href={`mailto:${PLATFORM.email}`}
                className="flex items-center gap-1.5 hover:text-foreground"
              >
                <Mail className="h-4 w-4" /> {PLATFORM.email}
              </a>
              {PLATFORM.whatsapp && (
                <a
                  href={`https://wa.me/${PLATFORM.whatsapp}`}
                  className="flex items-center gap-1.5 hover:text-foreground"
                >
                  <WhatsappIcon className="h-4 w-4" /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FooterCol = ({
  title,
  links,
}: {
  title: string;
  links: { label: string; href?: string; to?: string }[];
}) => (
  <div>
    <h4 className="mb-4 text-sm font-semibold">{title}</h4>
    <ul className="space-y-2.5 text-sm">
      {links.map((l) => (
        <li key={l.label}>
          {l.to ? (
            <Link to={l.to} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ) : (
            <a href={l.href} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </a>
          )}
        </li>
      ))}
    </ul>
  </div>
);

export default PlatformLanding;
