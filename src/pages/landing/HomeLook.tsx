import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Gift,
  Globe,
  Mail,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Store,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORM, studioUrl } from "@/config/platform";
import { contactHref, isWhatsapp } from "./content";
import hero from "@/assets/hero-beauty.jpg";
import nails1 from "@/assets/gallery/nails-1.jpg";
import nails2 from "@/assets/gallery/nails-2.jpg";
import lashes1 from "@/assets/gallery/lashes-1.jpg";
import lashes2 from "@/assets/gallery/lashes-2.jpg";

// The Zuri landing page in the studio-homepage-look layout: photo hero, a
// row of reasons, an image-and-text block, featured cards, a dark band with
// what's different, kinds of business, a dark steps band and a photo close.

const Eyebrow = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <p className={light ? "text-xs font-medium tracking-[0.16em] text-white/70" : "text-xs font-medium tracking-[0.16em] text-muted-foreground"}>
    {children}
  </p>
);

/** Full-width photo with the headline over it. */
export const PhotoHero = () => (
  <section className="relative isolate flex min-h-[88svh] items-end overflow-hidden md:items-center">
    <img src={hero} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/45 to-black/30 md:bg-gradient-to-r md:from-black/80 md:via-black/45 md:to-black/10" />
    <div className="container mx-auto px-4 pb-14 pt-32 md:py-32">
      <div className="max-w-xl text-white">
        <Eyebrow light>BOOKINGS · PAYMENTS · YOUR OWN WEBSITE</Eyebrow>
        <h1 className="mt-4 text-balance font-serif text-4xl font-semibold leading-[1.08] sm:text-5xl md:text-6xl">
          Your beauty business, beautifully online.
        </h1>
        <p className="mt-5 max-w-md text-white/85 md:text-lg">
          A website with your name, online booking, and payments by Mobile Money or card, paid
          straight to you. Ready the same day.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="rounded-full px-7" asChild>
            <Link to="/onboarding">Set up your studio</Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-full border-white/70 bg-transparent px-7 text-white hover:bg-white hover:text-foreground" asChild>
            <a href={studioUrl(PLATFORM.demoSlug)} target="_blank" rel="noreferrer">
              See a real studio
            </a>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

const WHY = [
  { icon: Globe, title: "Your own website" },
  { icon: Wallet, title: "Paid straight to you" },
  { icon: CalendarCheck, title: "Bookings run themselves" },
  { icon: ShieldCheck, title: "Made in Ghana, for Ghana" },
];

/** A single row of reasons, right under the hero. */
export const WhyRow = () => (
  <section className="border-b border-border py-12 md:py-14">
    <div className="container mx-auto px-4">
      <h2 className="text-center font-serif text-2xl font-semibold md:text-3xl">Why businesses choose Zuri</h2>
      <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
        {WHY.map((w) => (
          <div key={w.title} className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border">
              <w.icon className="h-5 w-5 text-primary" aria-hidden />
            </span>
            <span className="text-sm font-medium leading-snug">{w.title}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/** Photo on one side, the idea on the other, on a soft band. */
export const ApproachSplit = () => (
  <section className="bg-secondary py-16 md:py-24">
    <div className="container mx-auto grid items-center gap-10 px-4 md:grid-cols-2 md:gap-16">
      <img src={lashes1} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover" />
      <div>
        <Eyebrow>MADE FOR HOW YOU WORK</Eyebrow>
        <h2 className="mt-3 text-balance font-serif text-3xl font-semibold md:text-4xl">
          Less time on your phone, more time with clients.
        </h2>
        <p className="mt-4 text-muted-foreground">
          No more answering "are you free Saturday?" in your DMs. Clients see your prices and real
          free times, book, and pay a deposit. You get the booking, the money and a reminder sent
          for you.
        </p>
        <p className="mt-3 text-muted-foreground">
          Everything is managed from one simple dashboard, on your phone or laptop.
        </p>
        <Button className="mt-7 rounded-full px-7" asChild>
          <a href="#features">See what's included</a>
        </Button>
      </div>
    </div>
  </section>
);

const FEATURED = [
  { img: nails1, title: "Your booking website", text: "Your name, your colour, your prices and gallery, at your own web address." },
  { img: lashes2, title: "Payments and deposits", text: "Mobile Money or card. Deposits cut no-shows, and the money comes to you." },
  { img: nails2, title: "An online shop", text: "Sell products with your studio, or run Zuri Storefront for anything you sell." },
  { img: hero, title: "Loyalty and reviews", text: "Points for every visit, rewards for referrals, and reviews new clients can read." },
];

/** The main pieces, as photo cards. */
export const FeaturedCards = () => (
  <section id="features" className="scroll-mt-20 py-16 md:py-24">
    <div className="container mx-auto px-4">
      <div className="mx-auto mb-10 max-w-xl text-center">
        <Eyebrow>WHAT YOU GET</Eyebrow>
        <h2 className="mt-3 font-serif text-3xl font-semibold md:text-4xl">Everything in one place</h2>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURED.map((f) => (
          <article key={f.title} className="overflow-hidden rounded-2xl border border-border bg-card">
            <img src={f.img} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
            <div className="p-5">
              <h3 className="font-serif text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const DIFFERENCE = [
  { icon: Smartphone, title: "Built for phones", text: "Your clients book and pay from their phones, and you run it all from yours." },
  { icon: Wallet, title: "No middleman holding your money", text: "Payments settle to your own Mobile Money or bank account." },
  { icon: Gift, title: "Clients who come back", text: "Reminders, points and referral rewards happen on their own." },
  { icon: Store, title: "Grows with you", text: "Start with bookings, add a shop when you're ready." },
];

/** Dark band: what makes Zuri different, beside a photo. */
export const DifferenceBand = () => (
  <section className="grid bg-foreground text-background md:grid-cols-2">
    <div className="px-6 py-14 md:px-12 md:py-20 lg:px-20">
      <Eyebrow light>THE ZURI DIFFERENCE</Eyebrow>
      <h2 className="mt-3 text-balance font-serif text-3xl font-semibold md:text-4xl">
        Not another app to fight with.
      </h2>
      <ul className="mt-8 space-y-6">
        {DIFFERENCE.map((d) => (
          <li key={d.title} className="flex gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <d.icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold">{d.title}</p>
              <p className="mt-0.5 text-sm text-background/70">{d.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
    <img src={nails2} alt="" loading="lazy" className="h-72 w-full object-cover md:h-full" />
  </section>
);

const TYPES = [
  { img: nails1, label: "Nail studios" },
  { img: lashes1, label: "Lashes and brows" },
  { img: hero, label: "Hair and braids" },
  { img: lashes2, label: "Skin and spa" },
  { img: nails2, label: "Makeup artists" },
  { img: lashes1, label: "Barbershops" },
];

/** Kinds of business, as a swipeable row. */
export const TypesCarousel = () => {
  const row = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => row.current?.scrollBy({ left: dir * row.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <Eyebrow>FOR EVERY KIND OF STUDIO</Eyebrow>
          <h2 className="mt-3 font-serif text-3xl font-semibold md:text-4xl">Find your kind of business</h2>
          <p className="mt-3 text-muted-foreground">
            Your website starts with wording that fits what you do. Selling something else?{" "}
            <Link to="/onboarding" className="font-medium text-foreground underline underline-offset-4">Try Zuri Storefront</Link>.
          </p>
        </div>
        <div className="relative">
          <div ref={row} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none]">
            {TYPES.map((t) => (
              <Link
                key={t.label}
                to="/onboarding"
                className="group relative w-[70%] shrink-0 snap-start overflow-hidden rounded-2xl sm:w-[45%] lg:w-[calc((100%-3rem)/4)]"
              >
                <img src={t.img} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-12 font-serif text-lg font-semibold text-white">
                  {t.label}
                </span>
              </Link>
            ))}
          </div>
          <button type="button" onClick={() => scroll(-1)} aria-label="Previous" className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow md:flex">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label="Next" className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow md:flex">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

const STEPS = [
  { title: "Pick a plan", text: "Standard, Premium or Storefront, monthly or yearly." },
  { title: "Make it yours", text: "Add your logo, colour, services or products, and your hours." },
  { title: "Connect payouts", text: "Add your Mobile Money or bank account to get paid." },
  { title: "Share your link", text: "Put it on Instagram and WhatsApp and take bookings the same day." },
];

/** Dark band: how setting up works. */
export const StepsBand = () => (
  <section id="how" className="scroll-mt-20 bg-foreground py-16 text-background md:py-24">
    <div className="container mx-auto px-4">
      <div className="mx-auto mb-10 max-w-xl text-center">
        <Eyebrow light>GETTING STARTED</Eyebrow>
        <h2 className="mt-3 font-serif text-3xl font-semibold md:text-4xl">Set up in about 10 minutes</h2>
        <p className="mt-3 text-background/70">From sign-up to your first paid booking.</p>
      </div>
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="rounded-2xl bg-background p-6 text-foreground">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">{i + 1}</span>
            <p className="mt-4 font-semibold">{s.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

/** Get in touch, like the studio site's hours-and-contact block. */
export const ContactBlock = () => (
  <section className="py-16 md:py-20">
    <div className="container mx-auto grid gap-10 px-4 md:grid-cols-2">
      <div>
        <h2 className="font-serif text-2xl font-semibold md:text-3xl">Questions before you start?</h2>
        <p className="mt-3 max-w-md text-muted-foreground">
          Talk to a real person. We'll help you set up, add your services and connect your payouts.
        </p>
        <Button className="mt-6 rounded-full px-7" asChild>
          <Link to="/onboarding">Set up your studio</Link>
        </Button>
      </div>
      <ul className="space-y-5">
        <li className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border">
            {isWhatsapp() ? <MessageCircle className="h-5 w-5 text-primary" /> : <Mail className="h-5 w-5 text-primary" />}
          </span>
          <div>
            <p className="text-sm text-muted-foreground">{isWhatsapp() ? "WhatsApp" : "Email"}</p>
            <a href={contactHref()} target="_blank" rel="noreferrer" className="font-medium hover:underline">
              {isWhatsapp() ? "Message us on WhatsApp" : PLATFORM.email}
            </a>
          </div>
        </li>
        {isWhatsapp() && PLATFORM.email && (
          <li className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border">
              <Mail className="h-5 w-5 text-primary" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <a href={`mailto:${PLATFORM.email}`} className="font-medium hover:underline">{PLATFORM.email}</a>
            </div>
          </li>
        )}
      </ul>
    </div>
  </section>
);

/** Closing photo banner. */
export const PhotoCta = () => (
  <section className="relative isolate overflow-hidden">
    <img src={lashes2} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover" />
    <div className="absolute inset-0 -z-10 bg-black/60" />
    <div className="container mx-auto px-4 py-20 text-white md:py-28">
      <Eyebrow light>READY WHEN YOU ARE</Eyebrow>
      <h2 className="mt-3 max-w-lg text-balance font-serif text-3xl font-semibold md:text-5xl">
        Start taking bookings today.
      </h2>
      <Button size="lg" className="mt-8 rounded-full px-8" asChild>
        <Link to="/onboarding">Set up your studio</Link>
      </Button>
    </div>
  </section>
);
