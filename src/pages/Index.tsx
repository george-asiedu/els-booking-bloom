import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Clock,
  Facebook,
  Gem,
  Heart,
  Instagram,
  Mail,
  MapPin,
  Music2,
  Palette,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Smile,
  CalendarCheck,
  Leaf,
  Users,
  ArrowRight,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { Lightbox } from "@/components/storefront/Lightbox";
import { WhatsappIcon } from "@/components/icons/WhatsappIcon";
import {
  servicesApi,
  galleryApi,
  reviewsApi,
  contactInfoApi,
  businessHoursApi,
  commerceApi,
  productsApi,
  promoApi,
  studioStatsApi,
  type ServiceDTO,
} from "@/lib/api";
import { STUDIO_TYPES, studioTypeOf, templateOf, type ReasonItem } from "@/lib/studioTemplates";
import { cn } from "@/lib/utils";
import { socialHref } from "@/lib/social";
import { useStudio } from "@/hooks/useStudio";
import heroFallback from "@/assets/hero-beauty.jpg";
import { formatGHS } from "@/lib/currency";
import { landingDefaults } from "@/lib/landingDefaults";
import { useHideSplashWhen } from "@/lib/splash";
import { useStudioWhatsapp } from "@/hooks/useStudioWhatsapp";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Icons a studio can pick for its highlight cards (Appearance → Landing page).
const HIGHLIGHT_ICONS: Record<string, LucideIcon> = {
  star: Star,
  clock: Clock,
  heart: Heart,
  sparkles: Sparkles,
  award: Award,
  gem: Gem,
  palette: Palette,
  smile: Smile,
  shield: ShieldCheck,
  leaf: Leaf,
  users: Users,
  calendar: CalendarCheck,
};

const to12h = (t: string | null) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m ?? 0).padStart(2, "0")} ${ampm}`;
};
const priceOf = (s: ServiceDTO) =>
  s.on_promo && s.promo_price != null ? s.promo_price : s.price;

/** "1,240" / "4.8": a figure in the metrics strip. */
const Metric = ({ value, label }: { value: string; label: string }) => (
  <div className="px-2 text-center">
    <p className="font-serif text-3xl font-semibold tabular-nums md:text-4xl">{value}</p>
    <p className="mt-1 text-sm text-muted-foreground">{label}</p>
  </div>
);

/** A section's heading: one size, left-aligned, with an optional link on the right. */
const SectionHeading = ({
  title,
  intro,
  action,
}: {
  title: string;
  intro?: string;
  action?: React.ReactNode;
}) => (
  <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
    <div className="max-w-2xl">
      <h2 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">{title}</h2>
      {intro && <p className="mt-3 text-muted-foreground">{intro}</p>}
    </div>
    {action}
  </div>
);

const Index = () => {
  const { name: studioName, config, features, isLoading: configLoading } = useStudio();
  const content = config?.content;
  // The kind of studio sets the default wording; the template sets the layout.
  const type = STUDIO_TYPES[studioTypeOf(content?.studioType)];
  const template = templateOf(content?.siteTemplate);
  const defaults = {
    ...landingDefaults(studioName),
    heroHeadline: type.headline,
    heroSubtext: type.subtext,
  };
  // The studio's own wording for a slot, or the default.
  const copy = (field: keyof typeof defaults) => content?.[field] || defaults[field];
  const showTestimonials = content?.showTestimonials ?? true;
  // "Why choose us": the studio's own cards, else the defaults for its kind.
  const ownReasons = (content?.featureCards ?? []).filter((c) => c.title?.trim());
  const reasons: { icon: string; title: string; text: string }[] = ownReasons.length
    ? ownReasons.map((c) => ({ icon: c.icon ?? "star", title: c.title, text: c.description ?? "" }))
    : type.reasons.map((r: ReasonItem) => ({ icon: r.icon, title: r.title, text: r.text }));

  const [lightbox, setLightbox] = useState<number | null>(null);
  const reviewsRef = useRef<HTMLDivElement | null>(null);

  const { data: services = [] } = useQuery({
    queryKey: ["public-services-catalog"],
    queryFn: () => servicesApi.listActive(),
  });
  const popular = services.filter((s) => s.popular);
  const featured = (popular.length > 0 ? popular : services).slice(0, 4);

  const { data: gallery = [], isLoading: galleryLoading } = useQuery({
    queryKey: ["public-gallery"],
    queryFn: () => galleryApi.listActive(),
    enabled: features.gallery,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["approved-reviews"],
    queryFn: () => reviewsApi.listApproved(),
    enabled: features.reviews && showTestimonials,
  });

  const { data: stats } = useQuery({
    queryKey: ["studio-stats"],
    queryFn: () => studioStatsApi.get(),
    staleTime: 10 * 60 * 1000,
  });
  const { data: promos = [] } = useQuery({
    queryKey: ["promo-banners", "booking"],
    queryFn: () => promoApi.listActive("booking"),
    staleTime: 5 * 60 * 1000,
  });
  const offer = promos[0];

  const { data: contact } = useQuery({
    queryKey: ["contact-info"],
    queryFn: () => contactInfoApi.get(),
  });
  const whatsapp = useStudioWhatsapp();
  const { data: hours = [] } = useQuery({
    queryKey: ["business-hours"],
    queryFn: () => businessHoursApi.list(),
  });

  const { data: commerce } = useQuery({
    queryKey: ["commerce-settings"],
    queryFn: () => commerceApi.getSettings(),
  });
  const shopEnabled = features.commerce && (commerce?.enabled ?? false);
  const { data: products = [] } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => productsApi.listActive(),
    enabled: shopEnabled,
  });
  const featuredProducts = [
    ...products.filter((p) => p.popular),
    ...products.filter((p) => !p.popular),
  ].slice(0, 4);

  // The studio's chosen photos first, then its own gallery, then a bundled
  // photo so a brand-new studio's page is never empty.
  const galleryImgs = gallery
    .filter((g) => g.media_type === "image")
    .map((g) => ({ src: g.image_url, alt: g.title || studioName }));
  const heroBg = content?.heroImageUrl ?? galleryImgs[0]?.src ?? heroFallback;
  const aboutImg =
    content?.aboutImageUrl ?? galleryImgs[1]?.src ?? galleryImgs[0]?.src ?? heroFallback;
  const offerImg = galleryImgs[3]?.src ?? galleryImgs[0]?.src ?? heroFallback;
  const ctaBg = content?.ctaImageUrl ?? galleryImgs[2]?.src ?? galleryImgs[0]?.src ?? heroFallback;
  const serviceImg = (s: ServiceDTO, i: number) =>
    s.image_url ?? galleryImgs[(i + 2) % Math.max(galleryImgs.length, 1)]?.src ?? heroFallback;

  // Keep the loading screen up until the hero is final (see useHideSplashWhen).
  const [heroLoaded, setHeroLoaded] = useState<string | null>(null);
  const heroChosen =
    !configLoading && (Boolean(content?.heroImageUrl) || !features.gallery || !galleryLoading);
  useHideSplashWhen(heroChosen && heroLoaded === heroBg);

  const scrollReviews = (dir: 1 | -1) => {
    const el = reviewsRef.current;
    if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  const sortedHours = [...hours].sort((a, b) => a.day_of_week - b.day_of_week);

  // Real figures only (the API leaves out anything not yet meaningful).
  const metrics = [
    stats?.clientsServed && { value: stats.clientsServed.toLocaleString(), label: "Clients served" },
    stats?.appointmentsCompleted && { value: stats.appointmentsCompleted.toLocaleString(), label: "Appointments done" },
    stats?.averageRating && { value: `${stats.averageRating.toFixed(1)}★`, label: `From ${stats.reviewCount} reviews` },
    stats?.servicesOffered && { value: String(stats.servicesOffered), label: "Services to choose from" },
  ].filter(Boolean) as { value: string; label: string }[];

  const ReasonIcon = ({ name, className }: { name: string; className?: string }) => {
    const Icon = HIGHLIGHT_ICONS[name] ?? Star;
    return <Icon className={className} aria-hidden />;
  };

  return (
    <Layout heroOverlay={template !== "minimal"}>
      {/* Hero */}
      {template === "minimal" ? (
        <section data-no-reveal className="pb-12 pt-8 md:pb-20 md:pt-14">
          <div className="container mx-auto grid items-center gap-10 px-4 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="hero-rise mb-4 text-sm font-medium text-primary [animation-delay:80ms]">{copy("heroEyebrow")}</p>
              <h1 className="hero-rise text-balance font-serif text-4xl [animation-delay:180ms] font-semibold leading-[1.08] sm:text-5xl md:text-6xl">
                {copy("heroHeadline")}
              </h1>
              <p className="hero-rise mt-5 max-w-md text-lg text-muted-foreground [animation-delay:280ms]">{copy("heroSubtext")}</p>
              <div className="hero-rise mt-8 flex flex-col gap-3 [animation-delay:380ms] sm:flex-row">
                <Button size="lg" asChild>
                  <Link to="/book">Book an appointment</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/services">See prices</Link>
                </Button>
              </div>
            </div>
            <img
              src={heroBg}
              alt=""
              onLoad={() => setHeroLoaded(heroBg)}
              onError={() => setHeroLoaded(heroBg)}
              className="aspect-[4/5] w-full rounded-2xl object-cover sm:aspect-[4/3] lg:aspect-[4/5]"
            />
          </div>
        </section>
      ) : (
        <section
          data-no-reveal
          className={cn(
            "relative flex overflow-hidden",
            template === "bold" ? "min-h-[92svh] items-center pb-28 md:pb-24" : "min-h-[86svh] items-end pb-16 md:items-center md:pb-0",
          )}
        >
          <img
            src={heroBg}
            alt=""
            className="hero-zoom absolute inset-0 h-full w-full object-cover"
            onLoad={() => setHeroLoaded(heroBg)}
            onError={() => setHeroLoaded(heroBg)}
          />
          {/* Dark wash so white text reads on any photo. */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="container relative z-10 mx-auto px-4 pt-32">
            <div className="max-w-xl text-white">
              <p className="hero-rise mb-4 text-sm font-medium tracking-wide text-white/80 [animation-delay:80ms]">{copy("heroEyebrow")}</p>
              <h1
                className={cn(
                  "hero-rise text-balance leading-[1.05] [animation-delay:180ms]",
                  template === "bold"
                    ? "text-4xl font-bold sm:text-5xl md:text-6xl"
                    : "font-serif text-4xl font-semibold sm:text-5xl md:text-6xl",
                )}
              >
                {copy("heroHeadline")}
              </h1>
              <p className="hero-rise mt-5 max-w-md text-lg text-white/85 [animation-delay:280ms]">{copy("heroSubtext")}</p>
              <div className="hero-rise mt-8 flex flex-col gap-3 [animation-delay:380ms] sm:flex-row">
                <Button size="lg" asChild>
                  <Link to="/book">Book an appointment</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/70 bg-transparent text-white hover:bg-white/15 hover:text-white" asChild>
                  <Link to="/services">See prices</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Why choose us */}
      {template === "bold" ? (
        <section className="relative z-10 -mt-20 pb-6">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-6 rounded-2xl bg-band px-6 py-7 text-band-foreground shadow-xl md:grid-cols-4 md:px-10">
              {reasons.slice(0, 4).map((r) => (
                <div key={r.title} className="flex items-start gap-3">
                  <ReasonIcon name={r.icon} className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold leading-snug">{r.title}</p>
                    <p className="mt-0.5 hidden text-sm text-band-foreground/70 sm:block">{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-10 text-center font-serif text-2xl font-semibold md:text-3xl">
              {content?.featuresHeading || `Why clients choose ${studioName}`}
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {reasons.slice(0, 4).map((r) => (
                <div key={r.title} className="flex items-start gap-4 lg:flex-col lg:items-center lg:text-center">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                    <ReasonIcon name={r.icon} className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{r.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About */}
      <section className="bg-secondary/70 py-16 md:py-24">
        <div className="container mx-auto grid grid-cols-1 items-center gap-10 px-4 lg:grid-cols-2 lg:gap-16">
          <img
            src={aboutImg}
            alt={`At ${studioName}`}
            loading="lazy"
            className="aspect-[4/3] w-full rounded-lg object-cover lg:aspect-[5/4]"
          />
          <div>
            <p className="mb-3 text-sm font-medium text-primary">About {studioName}</p>
            <h2 className="text-balance font-serif text-3xl font-semibold leading-tight md:text-4xl">
              {copy("aboutHeading")}
            </h2>
            <p className="mt-5 max-w-prose whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
              {copy("aboutText")}
            </p>
            {contact?.showAddress && contact.address && (
              <p className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                {contact.address}
              </p>
            )}
            <Button className="mt-8" variant="outline" asChild>
              <Link to="/contact">
                Get in touch <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured services */}
      {featured.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <SectionHeading
              title={copy("servicesHeading")}
              action={
                <Button variant="outline" asChild>
                  <Link to="/services">Full price list</Link>
                </Button>
              }
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((s, i) => (
                <article key={s.id} className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
                  <img src={serviceImg(s, i)} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-serif text-lg font-semibold">{s.name}</h3>
                    {s.description && (
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{s.description}</p>
                    )}
                    <div className="mt-auto flex items-baseline justify-between gap-3 pt-5">
                      <p className="font-semibold tabular-nums">
                        {s.on_promo && s.promo_price != null && (
                          <span className="mr-1.5 text-sm font-normal text-muted-foreground line-through">
                            {formatGHS(s.price)}
                          </span>
                        )}
                        {formatGHS(priceOf(s))}
                        <span className="ml-1.5 text-sm font-normal text-muted-foreground">· {s.duration}</span>
                      </p>
                      <Link to="/book" className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline">
                        Book
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Metrics: real numbers, shown once there are enough to mean something. */}
      {metrics.length >= 2 && (
        <section className="border-y border-border py-12 md:py-14">
          <div className="container mx-auto grid grid-cols-2 gap-y-8 px-4 md:grid-cols-4">
            {metrics.map((m) => (
              <Metric key={m.label} value={m.value} label={m.label} />
            ))}
          </div>
        </section>
      )}

      {/* Special offer (the studio's first booking promotion), as in promo-banner */}
      {offer && (
        <section className="relative overflow-hidden bg-secondary">
          <div className="container mx-auto grid items-center gap-8 px-4 md:grid-cols-[1fr_auto_minmax(0,22rem)] md:gap-12">
            <div className="py-12 md:py-16">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Special offer</p>
              <p className="mt-3 max-w-xl text-balance font-serif text-3xl font-semibold leading-tight md:text-4xl">
                {offer.message}
              </p>
            </div>
            <Button size="lg" className="w-fit shrink-0" asChild>
              {offer.linkUrl ? <a href={offer.linkUrl}>Book now →</a> : <Link to="/book">Book now →</Link>}
            </Button>
            <img
              src={offerImg}
              alt=""
              loading="lazy"
              className="hidden h-full max-h-72 w-full self-end object-cover md:block md:[mask-image:linear-gradient(to_right,transparent,black_30%)]"
            />
          </div>
        </section>
      )}

      {/* Your visit, step by step */}
      <section className="bg-band py-16 text-band-foreground md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold md:text-4xl">Your visit, planned with care</h2>
            <p className="mt-3 text-band-foreground/70">From booking to aftercare, every step is simple and clear.</p>
          </div>
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {type.steps.map((st, i) => (
              <li key={st.title} className="rounded-xl bg-background/[0.06] p-6 ring-1 ring-background/10">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold">{st.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-band-foreground/70">{st.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Gallery */}
      {features.gallery && galleryImgs.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <SectionHeading
              title={copy("galleryHeading")}
              action={
                <Button variant="outline" asChild>
                  <Link to="/gallery">See all photos</Link>
                </Button>
              }
            />
            <div className="columns-2 gap-3 [column-fill:_balance] md:columns-3 md:gap-4 lg:columns-4">
              {galleryImgs.slice(0, 8).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(i)}
                  className="group mb-3 block w-full overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:mb-4"
                  aria-label={`View ${img.alt}`}
                >
                  <img src={img.src} alt={img.alt} loading="lazy" className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
                </button>
              ))}
            </div>
          </div>
          <Lightbox images={galleryImgs.slice(0, 8)} index={lightbox} onIndexChange={setLightbox} />
        </section>
      )}

      {/* Reviews */}
      {features.reviews && showTestimonials && reviews.length > 0 && (
        <section className="bg-secondary/70 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <SectionHeading
              title={copy("reviewsHeading")}
              intro={stats?.averageRating ? `Rated ${stats.averageRating.toFixed(1)} out of 5 by our clients.` : undefined}
              action={
                reviews.length > 1 && (
                  <div className="hidden gap-2 sm:flex">
                    <Button variant="outline" size="icon" onClick={() => scrollReviews(-1)} aria-label="Previous reviews">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => scrollReviews(1)} aria-label="Next reviews">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                )
              }
            />
            <div
              ref={reviewsRef}
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {reviews.map((r) => (
                <figure
                  key={r.id}
                  className="flex w-[85%] shrink-0 snap-start flex-col rounded-lg bg-card p-6 shadow-sm ring-1 ring-border sm:w-[46%] lg:w-[31%]"
                >
                  <div className="flex gap-0.5 text-primary" aria-label={`${r.rating} out of 5`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={cn("h-4 w-4", i < r.rating ? "fill-current" : "opacity-25")} aria-hidden />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 leading-relaxed">“{r.content}”</blockquote>
                  <figcaption className="mt-5 text-sm">
                    <span className="font-medium">{r.profiles?.full_name ?? "A client"}</span>
                    {r.services?.name && <span className="block text-muted-foreground">{r.services.name}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Loyalty */}
      {features.loyalty && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-6 rounded-lg border border-primary/30 bg-accent/50 p-8 md:flex-row md:items-center md:justify-between md:p-10">
              <div className="max-w-xl">
                <h2 className="font-serif text-2xl font-semibold md:text-3xl">{copy("loyaltyHeading")}</h2>
                <p className="mt-2 text-muted-foreground">{copy("loyaltyText")}</p>
              </div>
              <Button className="shrink-0" asChild>
                <Link to="/account">See your points</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Products */}
      {shopEnabled && featuredProducts.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <SectionHeading
              title="From the shop"
              action={
                <Button variant="outline" asChild>
                  <Link to="/shop">
                    <ShoppingBag className="mr-2 h-4 w-4" /> Visit the shop
                  </Link>
                </Button>
              }
            />
            <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <Link key={product.id} to={`/shop/${product.id}`} className="group block">
                  <div className="aspect-square overflow-hidden rounded-md bg-muted">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No photo yet</div>
                    )}
                  </div>
                  <h3 className="mt-3 line-clamp-1 font-medium group-hover:underline">{product.name}</h3>
                  <p className="mt-0.5 font-semibold tabular-nums">
                    {formatGHS(product.on_promo ? product.effective_price : product.price)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hours and contact */}
      <section className="bg-secondary/70 py-16 md:py-24">
        <div className="container mx-auto grid grid-cols-1 gap-12 px-4 md:grid-cols-2 xl:grid-cols-[minmax(0,20rem)_minmax(0,18rem)_1fr]">
          {sortedHours.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 font-serif text-3xl font-semibold">Opening hours</h2>
              <dl className="mt-6 max-w-sm space-y-2.5 text-sm">
                {sortedHours.map((h) => (
                  <div key={h.id} className="flex justify-between gap-4 border-b border-border/60 pb-2.5 last:border-0">
                    <dt className="text-muted-foreground">{DAYS[h.day_of_week]}</dt>
                    <dd className="font-medium tabular-nums">
                      {h.is_closed || !h.open_time ? "Closed" : `${to12h(h.open_time)} – ${to12h(h.close_time)}`}
                    </dd>
                  </div>
                ))}
              </dl>
              <Button className="mt-8" asChild>
                <Link to="/book">Book an appointment</Link>
              </Button>
            </div>
          )}
          <div>
            <h2 className="font-serif text-3xl font-semibold leading-tight">{copy("contactHeading")}</h2>
            <div className="mt-6 space-y-5">
              {contact?.showAddress && contact.address && (
                <ContactRow icon={MapPin} label="Address">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary"
                  >
                    {contact.address}
                  </a>
                </ContactRow>
              )}
              {contact?.showPhone && contact.phone && (
                <ContactRow icon={Phone} label="Phone">
                  <a href={`tel:${contact.phone}`} className="hover:text-primary">{contact.phone}</a>
                </ContactRow>
              )}
              {whatsapp && (
                <ContactRow icon={WhatsappIcon} label="WhatsApp">
                  <a href={whatsapp.href} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    {whatsapp.display}
                  </a>
                </ContactRow>
              )}
              {contact?.showEmail && contact.email && (
                <ContactRow icon={Mail} label="Email">
                  <a href={`mailto:${contact.email}`} className="hover:text-primary">{contact.email}</a>
                </ContactRow>
              )}
              {contact?.showInstagram && contact.instagram && (
                <ContactRow icon={Instagram} label="Instagram">
                  <a href={socialHref("instagram", contact.instagram)} target="_blank" rel="noreferrer" className="hover:text-primary">
                    @{contact.instagram.replace(/^@/, "")}
                  </a>
                </ContactRow>
              )}
              {contact?.showTiktok && contact.tiktok && (
                <ContactRow icon={Music2} label="TikTok">
                  <a href={socialHref("tiktok", contact.tiktok)} target="_blank" rel="noreferrer" className="hover:text-primary">
                    @{contact.tiktok.replace(/^@/, "")}
                  </a>
                </ContactRow>
              )}
              {contact?.showFacebook && contact.facebook && (
                <ContactRow icon={Facebook} label="Facebook">
                  <a href={socialHref("facebook", contact.facebook)} target="_blank" rel="noreferrer" className="hover:text-primary">
                    {contact.facebook.replace(/^https?:\/\/(www\.)?facebook\.com\//, "").replace(/^@/, "")}
                  </a>
                </ContactRow>
              )}
            </div>
          </div>
          {contact?.showAddress && contact.address && (
            <iframe
              title={`Map showing ${contact.address}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(contact.address)}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-80 w-full rounded-xl border border-border md:col-span-2 xl:col-span-1 xl:h-full xl:min-h-[26rem]"
            />
          )}
        </div>
      </section>

      {/* Closing call to action */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <img src={ctaBg} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
        <div className="container relative z-10 mx-auto px-4">
          <h2 className="max-w-2xl text-balance font-serif text-3xl font-semibold text-white md:text-5xl">
            {copy("ctaHeading")}
          </h2>
          <Button size="lg" className="mt-8" asChild>
            <Link to="/book">Book an appointment</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

const ContactRow = ({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-4">
    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-foreground">{children}</p>
    </div>
  </div>
);

export default Index;
