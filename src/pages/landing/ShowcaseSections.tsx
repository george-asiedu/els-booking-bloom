import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Gift, Star, Check, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";
import { PLATFORM, studioUrl } from "@/config/platform";
import { cn } from "@/lib/utils";
import { GHS, STUDIOS, FEATURES, JOURNEY } from "./content";
import { StorefrontMockup, FloatCard } from "./Visuals";

export const HeroSection = () => {
  return (
    <>
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

    </>
  );
};

export const TrustSection = () => {
  return (
    <>
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

    </>
  );
};

export const FeaturesSection = () => {
  return (
    <>
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
              <div className="group flex h-full flex-col justify-between rounded-3xl border border-border bg-gradient-to-b from-accent/40 to-card p-7 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-xl">
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
                className="group rounded-3xl border border-border bg-card p-7 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
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

    </>
  );
};

export const StorefrontsSection = () => {
  const [activeStudio, setActiveStudio] = useState(0);

  return (
    <>
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
                        "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-[background-color,border-color,box-shadow] duration-300",
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
                          "ml-auto h-4 w-4 shrink-0 transition-[opacity,color]",
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

    </>
  );
};

export const JourneySection = () => {
  return (
    <>
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
                  className="relative flex items-start gap-5 rounded-2xl border border-border bg-card p-5 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:shadow-md"
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

    </>
  );
};
