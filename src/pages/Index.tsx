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
  type ServiceDTO,
} from "@/lib/api";
import { useStudio } from "@/hooks/useStudio";
import heroFallback from "@/assets/hero-beauty.jpg";
import { formatGHS } from "@/lib/currency";
import { landingDefaults } from "@/lib/landingDefaults";
import { useHideSplashWhen } from "@/lib/splash";

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
};

// Turn a stored handle (or full URL) into a working social profile link.
const socialHref = (kind: "instagram" | "tiktok" | "facebook", v: string) => {
  if (v.startsWith("http")) return v;
  const handle = v.replace(/^@/, "").trim();
  if (kind === "instagram") return `https://instagram.com/${handle}`;
  if (kind === "tiktok") return `https://www.tiktok.com/@${handle}`;
  return `https://facebook.com/${handle}`;
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
  const defaults = landingDefaults(studioName);
  // The studio's own wording for a slot, or the default.
  const copy = (field: keyof typeof defaults) => content?.[field] || defaults[field];
  const showTestimonials = content?.showTestimonials ?? true;
  const highlights = (content?.featureCards ?? []).filter((c) => c.title?.trim());

  const [lightbox, setLightbox] = useState<number | null>(null);
  const reviewsRef = useRef<HTMLDivElement | null>(null);

  const { data: services = [] } = useQuery({
    queryKey: ["public-services-catalog"],
    queryFn: () => servicesApi.listActive(),
  });
  const popular = services.filter((s) => s.popular);
  const priceList = (popular.length > 0 ? popular : services).slice(0, 8);

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

  const { data: contact } = useQuery({
    queryKey: ["contact-info"],
    queryFn: () => contactInfoApi.get(),
  });
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
  const ctaBg = content?.ctaImageUrl ?? galleryImgs[2]?.src ?? galleryImgs[0]?.src ?? heroFallback;

  // Keep the loading screen up until the hero is final: the studio's settings
  // are in, the hero photo is chosen (a gallery photo can replace the default
  // once the gallery arrives) and that photo has decoded. Without this the
  // page would flash the default photo and swap it.
  const [heroLoaded, setHeroLoaded] = useState<string | null>(null);
  const heroChosen =
    !configLoading && (Boolean(content?.heroImageUrl) || !features.gallery || !galleryLoading);
  useHideSplashWhen(heroChosen && heroLoaded === heroBg);

  const scrollReviews = (dir: 1 | -1) => {
    const el = reviewsRef.current;
    if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  const sortedHours = [...hours].sort((a, b) => a.day_of_week - b.day_of_week);

  return (
    <Layout heroOverlay>
      {/* Hero: the page's one entrance animation. */}
      <section className="relative flex min-h-[88vh] items-end overflow-hidden pb-16 md:items-center md:pb-0">
        <img
          src={heroBg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onLoad={() => setHeroLoaded(heroBg)}
          // A broken image shouldn't hold the page hostage.
          onError={() => setHeroLoaded(heroBg)}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

        <div className="container relative z-10 mx-auto px-4 pt-28">
          <div className="max-w-xl animate-fade-in">
            <p className="mb-4 font-medium text-primary">{copy("heroEyebrow")}</p>
            <h1 className="font-serif text-4xl font-semibold leading-[1.08] text-foreground sm:text-5xl md:text-6xl">
              {copy("heroHeadline")}
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">{copy("heroSubtext")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/book">Book an appointment</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-background/60" asChild>
                <Link to="/services">See prices</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto grid grid-cols-1 items-center gap-10 px-4 lg:grid-cols-[5fr,6fr] lg:gap-20">
          <img
            src={aboutImg}
            alt={`At ${studioName}`}
            loading="lazy"
            className="aspect-[4/5] w-full rounded-lg object-cover outline outline-1 -outline-offset-1 outline-black/5"
          />
          <div>
            <h2 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">
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
          </div>
        </div>
      </section>

      {/* Highlights (only when the studio has written some) */}
      {highlights.length > 0 && (
        <section className="border-y border-border bg-secondary/60 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <SectionHeading title={copy("featuresHeading")} />
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {highlights.map((h, i) => {
                const Icon = HIGHLIGHT_ICONS[h.icon ?? ""] ?? Star;
                return (
                  <div key={i} className="flex gap-4">
                    <Icon className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden />
                    <div>
                      <h3 className="font-semibold">{h.title}</h3>
                      {h.description && (
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {h.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Services: laid out like a salon price list. */}
      {priceList.length > 0 && (
        <section className="py-20 md:py-28">
          {/* Capped width so each price sits close to the service it belongs to. */}
          <div className="container mx-auto max-w-4xl px-4">
            <SectionHeading
              title={copy("servicesHeading")}
              action={
                <Button variant="outline" asChild>
                  <Link to="/services">Full price list</Link>
                </Button>
              }
            />
            <ul className="divide-y divide-border border-y border-border">
              {priceList.map((s) => (
                <li key={s.id} className="grid grid-cols-[1fr,auto] items-baseline gap-x-6 gap-y-1 py-5">
                  <div className="min-w-0">
                    <h3 className="font-serif text-lg font-semibold">
                      {s.name}
                      {s.on_promo && s.promo_price != null && (
                        <span className="ml-2 align-middle text-xs font-medium text-primary">
                          On offer
                        </span>
                      )}
                    </h3>
                    {s.description && (
                      <p className="mt-1 max-w-prose text-sm text-muted-foreground">{s.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">
                      {s.on_promo && s.promo_price != null && (
                        <span className="mr-2 font-normal text-muted-foreground line-through">
                          {formatGHS(s.price)}
                        </span>
                      )}
                      {formatGHS(priceOf(s))}
                    </p>
                    <p className="text-sm text-muted-foreground">{s.duration}</p>
                  </div>
                  <Link
                    to="/book"
                    className="col-span-2 text-sm font-medium text-primary underline-offset-4 hover:underline sm:col-span-1 sm:col-start-1"
                  >
                    Book {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Gallery */}
      {features.gallery && galleryImgs.length > 0 && (
        <section className="bg-secondary/60 py-20 md:py-28">
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
              {galleryImgs.slice(0, 10).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(i)}
                  className="mb-3 block w-full overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:mb-4"
                  aria-label={`View ${img.alt}`}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    loading="lazy"
                    className="w-full object-cover outline outline-1 -outline-offset-1 outline-black/5 transition-opacity hover:opacity-90"
                  />
                </button>
              ))}
            </div>
          </div>
          <Lightbox images={galleryImgs.slice(0, 10)} index={lightbox} onIndexChange={setLightbox} />
        </section>
      )}

      {/* Reviews */}
      {features.reviews && showTestimonials && reviews.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <SectionHeading
              title={copy("reviewsHeading")}
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
                  className="flex w-[85%] shrink-0 snap-start flex-col justify-between rounded-lg border border-border bg-card p-6 sm:w-[46%] lg:w-[31%]"
                >
                  <blockquote className="text-lg leading-relaxed">“{r.content}”</blockquote>
                  <figcaption className="mt-5 text-sm">
                    <span className="font-medium">{r.profiles?.full_name ?? "A client"}</span>
                    {r.services?.name && (
                      <span className="block text-muted-foreground">{r.services.name}</span>
                    )}
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
            <div className="flex flex-col gap-6 rounded-lg border border-primary/25 bg-accent/40 p-8 md:flex-row md:items-center md:justify-between md:p-10">
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
        <section className="bg-secondary/60 py-20 md:py-28">
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
                      <img
                        src={product.image_url}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover outline outline-1 -outline-offset-1 outline-black/5"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No photo yet
                      </div>
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

      {/* Closing call to action */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <img src={ctaBg} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="container relative z-10 mx-auto px-4">
          <h2 className="max-w-2xl font-serif text-3xl font-semibold text-white md:text-5xl">
            {copy("ctaHeading")}
          </h2>
          <Button size="lg" variant="secondary" className="mt-8" asChild>
            <Link to="/book">Book an appointment</Link>
          </Button>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto grid grid-cols-1 gap-12 px-4 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">
              {copy("contactHeading")}
            </h2>
            <div className="mt-8 space-y-5">
              {contact?.showPhone && contact.phone && (
                <ContactRow icon={Phone} label="Phone">
                  <a href={`tel:${contact.phone}`} className="hover:text-primary">
                    {contact.phone}
                  </a>
                </ContactRow>
              )}
              {contact?.showWhatsapp && contact.whatsapp && (
                <ContactRow icon={WhatsappIcon} label="WhatsApp">
                  <a
                    href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary"
                  >
                    {contact.whatsapp}
                  </a>
                </ContactRow>
              )}
              {contact?.showEmail && contact.email && (
                <ContactRow icon={Mail} label="Email">
                  <a href={`mailto:${contact.email}`} className="hover:text-primary">
                    {contact.email}
                  </a>
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
            </div>
          </div>

          {sortedHours.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-6 md:p-8">
              <h3 className="flex items-center gap-2 font-semibold">
                <Clock className="h-5 w-5 text-primary" aria-hidden /> Opening hours
              </h3>
              <dl className="mt-5 space-y-2.5 text-sm">
                {sortedHours.map((h) => (
                  <div key={h.id} className="flex justify-between gap-4 border-b border-border/60 pb-2.5 last:border-0">
                    <dt className="text-muted-foreground">{DAYS[h.day_of_week]}</dt>
                    <dd className="font-medium tabular-nums">
                      {h.is_closed || !h.open_time
                        ? "Closed"
                        : `${to12h(h.open_time)} – ${to12h(h.close_time)}`}
                    </dd>
                  </div>
                ))}
              </dl>
              <Button className="mt-6 w-full" asChild>
                <Link to="/book">Book an appointment</Link>
              </Button>
            </div>
          )}
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
