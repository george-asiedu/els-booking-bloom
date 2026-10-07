import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Gift, Star, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORM, studioUrl } from "@/config/platform";
import { cn } from "@/lib/utils";
import { GHS, STUDIOS, FEATURES, JOURNEY } from "./content";
import { StorefrontMockup, FloatCard } from "./Visuals";

export const HeroSection = () => {
  return (
    <>
      {/* --------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden pt-28 md:pt-36">

        <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 py-12 lg:grid-cols-2 lg:gap-8 lg:py-20">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <p className="animate-fade-in mb-5 font-medium text-primary">{PLATFORM.heroBadge}</p>
            <h1 className="animate-fade-in font-serif text-4xl font-semibold leading-[1.08] [animation-delay:100ms] sm:text-5xl md:text-6xl">
              Bookings, payments and a website for your beauty studio.
            </h1>
            <p className="animate-fade-in mx-auto mt-6 max-w-xl text-lg text-muted-foreground [animation-delay:200ms] lg:mx-0">
              Clients see your prices, pick a free time and pay a deposit by Mobile Money or
              card. You get the booking, the money and a reminder sent for you.
            </p>
            <div className="animate-fade-in mt-8 flex flex-col items-center gap-3 [animation-delay:300ms] sm:flex-row sm:justify-center lg:justify-start">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link to="/onboarding">Set up your studio</Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <a href={studioUrl(PLATFORM.demoSlug)} target="_blank" rel="noreferrer">
                  See a real studio's page
                </a>
              </Button>
            </div>
            <p className="animate-fade-in mt-5 text-sm text-muted-foreground [animation-delay:400ms]">
              No setup fee. Most studios are taking bookings within 10 minutes.
            </p>
          </div>

          {/* Product showcase */}
          <div className="animate-fade-in relative mx-auto w-full max-w-md [animation-delay:400ms] lg:max-w-none">
            <StorefrontMockup studio={STUDIOS[0]} />
            <FloatCard className="-left-4 top-8 sm:-left-8">
              <Calendar className="h-4 w-4 text-primary" /> New booking
            </FloatCard>
            <FloatCard className="-right-3 top-28 sm:-right-6">
              <Check className="h-4 w-4 text-green-600" /> Deposit paid: {GHS(180)}
            </FloatCard>
            <FloatCard className="-left-3 bottom-24 sm:-left-6">
              <Gift className="h-4 w-4 text-primary" /> +50 loyalty points
            </FloatCard>
            <FloatCard className="-right-2 bottom-6 sm:-right-5">
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

export const FeaturesSection = () => {
  return (
    <>
      {/* ---------------------------------------------------------- Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <div>
              <h2 className="font-serif text-3xl font-semibold leading-tight md:text-5xl">
                Put away the notebook and the WhatsApp screenshots.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Your diary, prices, payments and client history live in one place,
                and your clients book themselves.
              </p>
            </div>
          </div>

          {/* Asymmetric layout: a tall feature with a preview + a 2x2 grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:row-span-2">
              <div className="flex h-full flex-col justify-between rounded-xl border border-border bg-secondary/60 p-7">
                <div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Bookings</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Clients book themselves, any time of day, including while
                    you're with someone in the chair.
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
            </div>

            {FEATURES.slice(1).map((f, i) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border bg-card p-7 hover:border-primary/30"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </div>
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
              <div>
                <h2 className="font-serif text-3xl font-semibold leading-[1.1] md:text-5xl">
                  Your own website, in your own colours.
                </h2>
                <p className="mt-4 max-w-md text-muted-foreground">
                  Every studio gets its own web address, with its logo, prices and
                  photos. Pick one below to see how different they look.
                </p>
              </div>
              <div className="mt-8 space-y-3">
                {STUDIOS.map((s, i) => (
                  <div key={s.key}>
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
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-serif font-semibold text-white"
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
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <StorefrontMockup
                key={STUDIOS[activeStudio].key}
                studio={STUDIOS[activeStudio]}
                className="animate-fade-in"
              />
            </div>
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
            <div>
              <h2 className="font-serif text-3xl font-semibold md:text-5xl">
                How a booking works
              </h2>
              <p className="mt-4 text-muted-foreground">
                What happens for a client, from finding you to coming back.
              </p>
            </div>
          </div>

          <div className="relative mx-auto max-w-3xl">
            {/* Connector line */}
            <div className="absolute left-[27px] top-4 bottom-4 hidden w-px bg-gradient-to-b from-primary/60 via-primary/30 to-transparent sm:block" />
            <div className="space-y-5">
              {JOURNEY.map((step, i) => (
                <div
                  key={step.n}
                  className="relative flex items-start gap-5 rounded-2xl border border-border bg-card p-5"
                >
                  <span className="z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/20">
                    {step.n}
                  </span>
                  <div className="pt-1.5">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </>
  );
};
