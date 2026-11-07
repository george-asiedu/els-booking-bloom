import { useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { platformReviewsApi } from "@/lib/api";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Gift,
  Globe,
  ShieldCheck,
  Smartphone,
  Star,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { PLATFORM, studioUrl } from "@/config/platform";
import { cn } from "@/lib/utils";
import { HeroSlides } from "@/components/HeroSlides";
// Photos: Unsplash (free to use under the Unsplash License).
import hero from "@/assets/landing/hero-salon.webp";
import ownerDesk from "@/assets/landing/owner-desk.webp";
import bookingPhone from "@/assets/landing/booking-phone.webp";
import paymentsPhone from "@/assets/landing/payments-phone.webp";
import shopOwner from "@/assets/landing/shop-owner.webp";
import loyaltyRobe from "@/assets/landing/loyalty-robe.webp";
import barberAtWork from "@/assets/landing/barber-at-work.webp";
import typeNails from "@/assets/landing/type-nails.webp";
import typeLashes from "@/assets/landing/type-lashes.webp";
import typeBraids from "@/assets/landing/type-braids.webp";
import typeSkin from "@/assets/landing/type-skin.webp";
import typeMakeup from "@/assets/landing/type-makeup.webp";
import typeBarber from "@/assets/landing/type-barber.webp";
import typeBoutique from "@/assets/landing/type-boutique.webp";
import typeMassage from "@/assets/landing/type-massage.webp";
import typeNaturalHair from "@/assets/landing/type-natural-hair.webp";
import typePedicure from "@/assets/landing/type-pedicure.webp";
import typeBrows from "@/assets/landing/type-brows.webp";
import typeWellness from "@/assets/landing/type-wellness.webp";
import typeTattoo from "@/assets/landing/type-tattoo.webp";
import typePiercing from "@/assets/landing/type-piercing.webp";
import typeHenna from "@/assets/landing/type-henna.webp";
import typeSchool from "@/assets/landing/type-school.webp";
import typeAesthetics from "@/assets/landing/type-aesthetics.webp";
import typeLaser from "@/assets/landing/type-laser.webp";
import typeMicroblading from "@/assets/landing/type-microblading.webp";
import typeLashExt from "@/assets/landing/type-lash-ext.webp";
import typeSalon from "@/assets/landing/type-salon.webp";
import typeTeeth from "@/assets/landing/type-teeth.webp";
import typeScalp from "@/assets/landing/type-scalp.webp";
import typeLocs from "@/assets/landing/type-locs.webp";
import salonOwner from "@/assets/landing/salon-owner.webp";

// The Zuri landing page in the studio-homepage-look layout: photo hero, a
// row of reasons, an image-and-text block, featured cards, a dark band with
// what's different, kinds of business, a dark steps band and a photo close.
// Motion: one staged hero entrance, then sections fade up as they arrive
// (Reveal, which respects reduced motion).

const Eyebrow = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <p className={light ? "text-xs font-medium tracking-[0.16em] text-white/70" : "text-xs font-medium tracking-[0.16em] text-muted-foreground"}>
    {children}
  </p>
);

/** Full-width photo with the headline over it. */
export const PhotoHero = () => (
  <section className="relative isolate flex min-h-[88svh] items-end overflow-hidden md:items-center">
    <HeroSlides images={[hero, barberAtWork, typeBraids, typeNails, typeLashes]} className="absolute inset-0 -z-20" imgClassName="object-[60%_30%]" />
    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/45 to-black/30 md:bg-gradient-to-r md:from-black/80 md:via-black/45 md:to-black/10" />
    <div className="container mx-auto px-4 pb-14 pt-40 md:py-40">
      <div className="max-w-xl text-white">
        <div className="hero-rise [animation-delay:100ms]">
          <Eyebrow light>BOOKINGS · PAYMENTS · YOUR OWN WEBSITE</Eyebrow>
        </div>
        <h1 className="hero-rise mt-4 text-balance font-serif text-4xl font-semibold leading-[1.08] [animation-delay:220ms] sm:text-5xl md:text-6xl">
          Your beauty business, beautifully online.
        </h1>
        <p className="hero-rise mt-5 max-w-md text-white/85 [animation-delay:340ms] md:text-lg">
          A website with your name, online booking, and payments by Mobile Money or card, paid
          straight to you. Ready the same day.
        </p>
        <div className="hero-rise mt-8 flex flex-col gap-3 [animation-delay:460ms] sm:flex-row">
          <Button size="lg" className="rounded-full px-7 transition-transform hover:-translate-y-0.5 active:scale-[0.97]" asChild>
            <Link to="/onboarding">Set up your studio</Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-full border-white/70 bg-transparent px-7 text-white hover:bg-white/15 hover:text-white" asChild>
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
      <Reveal>
        <h2 className="text-center font-serif text-2xl font-semibold md:text-3xl">Why businesses choose Zuri</h2>
      </Reveal>
      <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
        {WHY.map((w, i) => (
          <Reveal key={w.title} delay={i * 90} className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border">
              <w.icon className="h-5 w-5 text-primary" aria-hidden />
            </span>
            <span className="text-sm font-medium leading-snug">{w.title}</span>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

/** Photo on one side, the idea on the other, on a soft band. */
export const ApproachSplit = () => (
  <section className="bg-secondary py-16 md:py-24">
    <div className="container mx-auto grid items-center gap-10 px-4 md:grid-cols-2 md:gap-16">
      <Reveal>
        <img src={ownerDesk} alt="A business owner on a call at her desk" loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover" />
      </Reveal>
      <Reveal delay={120}>
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
      </Reveal>
    </div>
  </section>
);

const FEATURED = [
  { img: bookingPhone, title: "Your booking website", text: "Your name, your colour, your prices and gallery, at your own web address." },
  { img: paymentsPhone, title: "Payments and deposits", text: "Mobile Money or card. Deposits cut no-shows, and the money comes to you." },
  { img: shopOwner, title: "An online shop", text: "Sell products with your studio, or run Zuri Storefront for anything you sell." },
  { img: loyaltyRobe, title: "Loyalty and reviews", text: "Points for every visit, rewards for referrals, and reviews new clients can read." },
];

/** The main pieces, as photo cards. */
export const FeaturedCards = () => (
  <section id="features" className="scroll-mt-24 py-16 md:py-24">
    <div className="container mx-auto px-4">
      <Reveal className="mx-auto mb-10 max-w-xl text-center">
        <Eyebrow>WHAT YOU GET</Eyebrow>
        <h2 className="mt-3 font-serif text-3xl font-semibold md:text-4xl">Everything in one place</h2>
      </Reveal>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURED.map((f, i) => (
          <Reveal key={f.title} delay={i * 90}>
            <article className="group h-full overflow-hidden rounded-2xl border border-border bg-card transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-xl">
              <div className="overflow-hidden">
                <img src={f.img} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
              </div>
              <div className="relative p-5">
                <span className="absolute left-5 top-0 h-0.5 w-0 bg-primary transition-[width] duration-500 group-hover:w-12" aria-hidden />
                <h3 className="font-serif text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

const DIFFERENCE = [
  { icon: Smartphone, title: "Built for phones", text: "Clients book and pay from their phones; you run it all from yours." },
  { icon: Wallet, title: "No middleman holding your money", text: "Payments settle to your own Mobile Money or bank account." },
  { icon: Gift, title: "Clients who come back", text: "Reminders, points and referral rewards happen on their own." },
];

/** Dark band: what makes Zuri different, beside a photo. Kept compact. */
export const DifferenceBand = () => (
  <section className="bg-band text-band-foreground">
    <div className="container mx-auto grid items-center gap-8 px-4 py-12 md:grid-cols-[1.2fr_1fr] md:py-14">
      <Reveal>
        <Eyebrow light>THE ZURI DIFFERENCE</Eyebrow>
        <h2 className="mt-2 text-balance font-serif text-2xl font-semibold md:text-3xl">Not another app to fight with.</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
          {DIFFERENCE.map((d) => (
            <li key={d.title} className="flex gap-3 lg:flex-col">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <d.icon className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold">{d.title}</p>
                <p className="mt-0.5 text-sm text-band-foreground/70">{d.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={120}>
        <img src={barberAtWork} alt="A barber at work" loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover md:aspect-[5/4]" />
      </Reveal>
    </div>
  </section>
);

const TYPES = [
  { img: typeSalon, label: "Hair salons" },
  { img: typeBraids, label: "Braiders" },
  { img: typeNaturalHair, label: "Natural hair and wigs" },
  { img: typeLocs, label: "Locs and extensions" },
  { img: typeScalp, label: "Scalp and hair restoration" },
  { img: typeBarber, label: "Barbershops" },
  { img: typeNails, label: "Nail studios" },
  { img: typePedicure, label: "Pedicure and foot spas" },
  { img: typeLashExt, label: "Eyelash extensions" },
  { img: typeBrows, label: "Brows and threading" },
  { img: typeMicroblading, label: "Microblading and permanent makeup" },
  { img: typeLashes, label: "Makeup artists" },
  { img: typeMakeup, label: "Bridal beauty" },
  { img: typeSkin, label: "Skin care and facials" },
  { img: typeAesthetics, label: "Aesthetic clinics and med spas" },
  { img: typeLaser, label: "Laser hair removal" },
  { img: typeMassage, label: "Massage and day spas" },
  { img: typeWellness, label: "Waxing, tanning and body care" },
  { img: typeTattoo, label: "Tattoo studios" },
  { img: typePiercing, label: "Body piercing" },
  { img: typeHenna, label: "Henna artists" },
  { img: typeTeeth, label: "Teeth whitening" },
  { img: typeSchool, label: "Beauty schools and training" },
  { img: typeBoutique, label: "Beauty supply and shops" },
];

/** Kinds of business, as a swipeable row. */
export const TypesCarousel = () => {
  const row = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => row.current?.scrollBy({ left: dir * row.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <Reveal className="mx-auto mb-10 max-w-xl text-center">
          <Eyebrow>FOR EVERY KIND OF BEAUTY BUSINESS</Eyebrow>
          <h2 className="mt-3 font-serif text-3xl font-semibold md:text-4xl">Find your kind of business</h2>
          <p className="mt-3 text-muted-foreground">
            Shops, home studios and mobile artists alike. Don't see yours? If you take bookings,
            Zuri works for you. Selling something else?{" "}
            <Link to="/onboarding" className="font-medium text-foreground underline underline-offset-4">Try Zuri Storefront</Link>.
          </p>
        </Reveal>
        <div className="relative">
          <div ref={row} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none]">
            {TYPES.map((t) => (
              <Link
                key={t.label}
                to="/onboarding"
                className="group relative w-[70%] shrink-0 snap-start overflow-hidden rounded-2xl sm:w-[45%] lg:w-[calc((100%-3rem)/4)]"
              >
                <img src={t.img} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-12 font-serif text-lg font-semibold text-white">
                  {t.label}
                </span>
              </Link>
            ))}
          </div>
          <button type="button" onClick={() => scroll(-1)} aria-label="Previous" className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow transition-transform hover:scale-105 md:flex">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label="Next" className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow transition-transform hover:scale-105 md:flex">
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
  <section id="how" className="scroll-mt-24 bg-band py-16 text-band-foreground md:py-24">
    <div className="container mx-auto px-4">
      <Reveal className="mx-auto mb-10 max-w-xl text-center">
        <Eyebrow light>GETTING STARTED</Eyebrow>
        <h2 className="mt-3 font-serif text-3xl font-semibold md:text-4xl">Set up in about 5 minutes</h2>
        <p className="mt-3 text-band-foreground/70">From sign-up to your first paid booking.</p>
      </Reveal>
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <Reveal as="li" key={s.title} delay={i * 110}>
            <div className="h-full rounded-2xl bg-background p-6 text-foreground transition-transform duration-300 hover:-translate-y-1">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">{i + 1}</span>
              <p className="mt-4 font-semibold">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  </section>
);

// Shown until real reviews are approved, and labelled as examples on the page.
const EXAMPLE_TESTIMONIALS = [
  { id: "a", content: "Clients stopped asking me for prices in my DMs. They see everything and book by themselves.", authorName: "A nail studio owner", rating: 5 },
  { id: "b", content: "Deposits by Mobile Money cut my no-shows, and the money comes straight to my account.", authorName: "A braiding studio owner", rating: 5 },
  { id: "c", content: "I set up my site on my phone between clients. It looks like I paid a designer for it.", authorName: "A makeup artist", rating: 5 },
];

/** What owners say: real approved reviews, submitted from the studio admin. */
export const TestimonialsSection = () => {
  const { data: real = [] } = useQuery({
    queryKey: ["platform-testimonials"],
    queryFn: () => platformReviewsApi.listApproved(),
    staleTime: 10 * 60 * 1000,
  });
  const examples = real.length === 0;
  const shown = examples ? EXAMPLE_TESTIMONIALS : real.slice(0, 3);
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <Reveal className="mx-auto mb-10 max-w-xl text-center">
          <Eyebrow>TESTIMONIALS</Eyebrow>
          <h2 className="mt-3 text-balance font-serif text-3xl font-semibold md:text-4xl">
            Loved by the people running the business
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {shown.map((t, i) => (
            <Reveal key={t.id} delay={i * 90}>
              <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex gap-0.5 text-primary" aria-label={`${t.rating} out of 5`}>
                  {Array.from({ length: 5 }, (_, j) => (
                    <Star key={j} className={cn("h-4 w-4", j < t.rating ? "fill-current" : "opacity-25")} aria-hidden />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 font-serif text-lg leading-snug">"{t.content}"</blockquote>
                <figcaption className="mt-5 text-sm font-medium">{t.authorName}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        {examples && (
          <p className="mt-6 text-center text-xs text-muted-foreground">Examples of how studios use Zuri.</p>
        )}
      </div>
    </section>
  );
};

/** Closing photo banner. */
export const PhotoCta = () => (
  <section className="relative isolate overflow-hidden">
    <img src={salonOwner} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover" />
    <div className="absolute inset-0 -z-10 bg-black/60" />
    <Reveal className={cn("container mx-auto px-4 py-14 text-white md:py-20")}>
      <Eyebrow light>READY WHEN YOU ARE</Eyebrow>
      <h2 className="mt-3 max-w-lg text-balance font-serif text-3xl font-semibold md:text-5xl">
        Start taking bookings today.
      </h2>
      <Button size="lg" className="mt-7 rounded-full px-8 transition-transform hover:-translate-y-0.5" asChild>
        <Link to="/onboarding">Set up your studio</Link>
      </Button>
    </Reveal>
  </section>
);
