import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { WhatsappIcon } from "@/components/icons/WhatsappIcon";
import { PLATFORM, PLANS, planPrice, studioUrl, YEARLY_FREE_MONTHS } from "@/config/platform";
import { cn } from "@/lib/utils";
import { GHS, FAQ, isWhatsapp, contactHref } from "./content";
import { FooterCol } from "./Visuals";
import { hasNoSetupFee, subscriptionSetup, useOnboardingConfig } from "@/lib/setupFee";

export const PricingSection = () => {
  const [cadence, setCadence] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const { data: billing } = useOnboardingConfig();
  const anySetup =
    subscriptionSetup(billing, "STANDARD", cadence) ?? subscriptionSetup(billing, "PREMIUM", cadence);

  return (
    <>
      {/* ------------------------------------------------------------ Pricing */}
      <section id="pricing" className="bg-secondary py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <div>
              <h2 className="font-serif text-3xl font-semibold md:text-5xl">
                Two plans, paid monthly or yearly.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Both include bookings, payments and your website. Premium adds an
                online shop.{" "}
                {anySetup
                  ? `A setup fee at signup covers your first ${anySetup.months} months, then the plan price applies. Cancel at any time.`
                  : hasNoSetupFee(billing)
                    ? "There's no setup fee and you can cancel at any time."
                    : "You can cancel at any time."}
              </p>
            </div>
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
                    <span className="ml-1 text-xs opacity-80">
                      save {YEARLY_FREE_MONTHS} months
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-xl border bg-card p-8",
                  plan.featured
                    ? "border-primary shadow-lg ring-1 ring-primary/20"
                    : "border-border",
                )}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Adds the online shop
                  </span>
                )}
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="font-serif text-4xl font-semibold">
                    {GHS(planPrice(plan, cadence))}
                  </span>
                  <span className="mb-1 text-sm text-muted-foreground">
                    /{cadence === "MONTHLY" ? "month" : "year"}
                  </span>
                </div>
                {(() => {
                  const setup = subscriptionSetup(billing, plan.id, cadence);
                  return setup ? (
                    <p className="mt-3 rounded-md bg-accent/60 px-3 py-2 text-sm">
                      Starts with a{" "}
                      <span className="font-semibold tabular-nums">{GHS(setup.fee)}</span>{" "}
                      setup fee that covers your first {setup.months} months.
                    </p>
                  ) : null;
                })()}
                {/* flex-1 takes up the spare height, so every card's button
                    lines up at the bottom whatever its feature count. */}
                <ul className="mt-6 flex-1 space-y-3">
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
                    Choose {plan.name}
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center text-sm text-muted-foreground">
            Not ready yet?{" "}
            <a
              href={contactHref()}
              target={isWhatsapp() ? "_blank" : undefined}
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Talk to us
            </a>{" "}
            and we'll help you get set up.
          </p>
        </div>
      </section>

    </>
  );
};

export const FaqSection = () => {
  return (
    <>
      {/* ---------------------------------------------------------------- FAQ */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto max-w-3xl px-4">
          <div>
            <h2 className="mb-10 text-center font-serif text-3xl font-semibold md:text-4xl">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <div
                key={item.q}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
};

export const FinalCtaSection = () => {
  return (
    <>
      {/* ---------------------------------------------------------- Final CTA */}
      <section className="px-4 pb-24 pt-4">
        <div className="container relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-accent/60 via-background to-primary/10 p-10 text-center md:p-16">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="animate-float-slow absolute -left-10 -top-10 h-52 w-52 rounded-full bg-primary/15 blur-3xl" />
            <div className="animate-float-slow absolute -bottom-12 -right-8 h-56 w-56 rounded-full bg-primary/10 blur-3xl [animation-delay:2s]" />
          </div>
          <div>
            <h2 className="mx-auto max-w-2xl font-serif text-3xl font-semibold leading-tight md:text-5xl">
              Ready to take bookings online?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Set up your studio now, or message us first if you'd like a hand.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="group w-full sm:w-auto" asChild>
                <Link to="/onboarding">
                  Set up your studio
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <a href={studioUrl(PLATFORM.demoSlug)} target="_blank" rel="noreferrer">
                  See a real studio's page
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

    </>
  );
};

export const FooterSection = () => {
  return (
    <>
      {/* ------------------------------------------------------------- Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
            <div className="col-span-2 md:col-span-2">
              <BrandLogo full />
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                Bookings, payments and a website for every kind of beauty business in Ghana.
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
                { label: "Set up your studio", to: "/onboarding" },
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
    </>
  );
};
