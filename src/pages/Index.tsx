import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Gift,
  ShoppingBag,
  Phone,
  Mail,
  MapPin,
  Clock,
  Instagram,
  Music2,
  Facebook,
  ChevronLeft,
  ChevronRight,
  Quote,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { Reveal } from "@/components/Reveal";
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
} from "@/lib/api";
import { services as staticServices } from "@/data/services";
import { useStudio } from "@/hooks/useStudio";
import heroFallback from "@/assets/hero-beauty.jpg";

const GHS = (n: number) => `GH₵ ${n.toLocaleString()}`;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

const Index = () => {
  const { name: studioName, config, features } = useStudio();
  const heroHeadline = config?.content.heroHeadline;
  const heroSubtext = config?.content.heroSubtext;
  const aboutText = config?.content.aboutText;
  const showTestimonials = config?.content.showTestimonials ?? true;

  const [lightbox, setLightbox] = useState<number | null>(null);
  const reviewsRef = useRef<HTMLDivElement | null>(null);

  const { data: apiServices } = useQuery({
    queryKey: ["public-services-catalog"],
    queryFn: () => servicesApi.listActive(),
  });
  const source = apiServices && apiServices.length > 0 ? apiServices : staticServices;
  const popularServices = source.filter((s) => s.popular);
  const services = (popularServices.length > 0 ? popularServices : source).slice(0, 6);
  const featured = services.slice(0, 2);

  const { data: gallery = [] } = useQuery({
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

  // Real imagery drives the composition; fall back to the bundled photo.
  const galleryImgs = gallery.map((g) => ({ src: g.image_url, alt: g.title || studioName }));
  const heroBg = galleryImgs[0]?.src ?? heroFallback;
  const introImg = galleryImgs[1]?.src ?? galleryImgs[0]?.src ?? heroFallback;
  const ctaBg = galleryImgs[2]?.src ?? galleryImgs[0]?.src ?? heroFallback;

  const stats = [
    { value: source.length, label: "Services" },
    { value: gallery.length, label: "Looks created" },
    { value: reviews.length, label: "Client reviews" },
  ].filter((s) => s.value > 0);

  const scrollReviews = (dir: 1 | -1) => {
    const el = reviewsRef.current;
    if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <Layout heroOverlay>
      {/* ------------------------------------------------------------- Hero */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden">
        <img
          src={heroBg}
          alt=""
          className="animate-fade-in absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />

        <div className="container relative z-10 mx-auto px-4 pt-24">
          <div className="max-w-xl">
            <span className="animate-fade-in mb-5 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-4 w-4" /> Welcome to {studioName}
            </span>
            <h1 className="animate-fade-in font-serif text-4xl font-bold leading-[1.05] text-foreground [animation-delay:120ms] sm:text-5xl md:text-6xl">
              {heroHeadline ?? (
                <>
                  Your beauty,
                  <br />
                  <span className="text-primary">your signature.</span>
                </>
              )}
            </h1>
            <p className="animate-fade-in mt-6 max-w-md text-lg text-muted-foreground [animation-delay:240ms]">
              {heroSubtext ||
                "Personalised beauty services designed to make you feel confident, polished and unforgettable."}
            </p>
            <div className="animate-fade-in mt-8 flex flex-col gap-3 [animation-delay:360ms] sm:flex-row">
              <Button size="lg" className="group" asChild>
                <Link to="/book">
                  Book your appointment
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/services">Explore services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Studio intro */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto grid grid-cols-1 items-center gap-10 px-4 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative order-2 lg:order-1">
            <img
              src={introImg}
              alt={`Work by ${studioName}`}
              loading="lazy"
              className="aspect-[4/5] w-full rounded-2xl object-cover"
            />
          </Reveal>
          <Reveal delay={100} className="order-1 lg:order-2">
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              The studio
            </span>
            <h2 className="mt-3 font-serif text-3xl font-bold leading-tight md:text-5xl">
              Beauty designed around you.
            </h2>
            <p className="mt-5 max-w-md text-muted-foreground">
              {aboutText ||
                `At ${studioName}, every appointment is personal. From the first consultation to the final reveal, your look is tailored to you — using premium products and a careful, artist's eye.`}
            </p>
            {stats.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-8">
                {stats.map((s) => (
                  <div key={s.label}>
                    <p className="font-serif text-3xl font-bold text-primary">
                      {s.value}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
            <Button className="group mt-8" asChild>
              <Link to="/book">
                Book an appointment
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------ Featured + services */}
      {services.length > 0 && (
        <section className="bg-secondary py-20 md:py-28">
          <div className="container mx-auto px-4">
            <Reveal className="mx-auto mb-14 max-w-2xl text-center">
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
                Services
              </span>
              <h2 className="mt-3 font-serif text-3xl font-bold md:text-5xl">
                Designed to make you feel your best.
              </h2>
            </Reveal>

            {/* Featured (large) */}
            {featured.length >= 2 && (
              <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
                {featured.map((s, i) => {
                  const img: string | null =
                    "image_url" in s
                      ? (s as { image_url: string | null }).image_url
                      : null;
                  return (
                  <Reveal
                    key={s.id}
                    delay={i * 100}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-muted">
                      {img ? (
                        <img
                          src={img}
                          alt={s.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent to-secondary">
                          <Sparkles className="h-10 w-10 text-primary/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-end justify-between gap-4 p-6">
                      <div>
                        <h3 className="font-serif text-xl font-semibold">{s.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {s.duration} ·{" "}
                          {s.on_promo && s.promo_price != null
                            ? GHS(s.promo_price)
                            : GHS(s.price)}
                        </p>
                      </div>
                      <Button size="sm" className="group/btn shrink-0" asChild>
                        <Link to="/book">
                          Book
                          <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                        </Link>
                      </Button>
                    </div>
                  </Reveal>
                  );
                })}
              </div>
            )}

            {/* Editorial rows */}
            <div className="mx-auto max-w-4xl divide-y divide-border border-y border-border">
              {services.map((s, i) => (
                <Reveal
                  key={s.id}
                  delay={(i % 3) * 70}
                  className="group grid grid-cols-[auto,1fr,auto] items-center gap-4 py-5 transition-colors sm:gap-6"
                >
                  <span className="font-serif text-sm text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-serif text-lg font-semibold transition-colors group-hover:text-primary">
                      {s.name}
                    </h3>
                    <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                      {s.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-semibold">
                        {s.on_promo && s.promo_price != null
                          ? GHS(s.promo_price)
                          : GHS(s.price)}
                      </p>
                      <p className="text-xs text-muted-foreground">{s.duration}</p>
                    </div>
                    <Link
                      to="/book"
                      className="flex items-center gap-1 text-sm font-medium text-primary opacity-70 transition-opacity group-hover:opacity-100"
                    >
                      Book <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Button variant="outline" className="group" asChild>
                <Link to="/services">
                  View all services
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- Gallery */}
      {features.gallery && galleryImgs.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <Reveal className="mx-auto mb-12 max-w-2xl text-center">
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
                Our work
              </span>
              <h2 className="mt-3 font-serif text-3xl font-bold md:text-5xl">
                A little inspiration for your next look.
              </h2>
            </Reveal>

            <div className="columns-2 gap-3 [column-fill:_balance] md:columns-3 md:gap-4 lg:columns-4">
              {galleryImgs.slice(0, 10).map((img, i) => (
                <Reveal key={i} delay={(i % 4) * 60} className="mb-3 md:mb-4">
                  <button
                    onClick={() => setLightbox(i)}
                    className="group relative block w-full overflow-hidden rounded-xl"
                    aria-label={`View ${img.alt}`}
                  >
                    <img
                      src={img.src}
                      alt={img.alt}
                      loading="lazy"
                      className="w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 opacity-0 transition-all duration-300 group-hover:bg-foreground/20 group-hover:opacity-100">
                      <span className="rounded-full bg-background/90 px-4 py-1.5 text-xs font-medium">
                        View
                      </span>
                    </span>
                  </button>
                </Reveal>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Button variant="outline" className="group" asChild>
                <Link to="/gallery">
                  View full gallery
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
          <Lightbox images={galleryImgs.slice(0, 10)} index={lightbox} onIndexChange={setLightbox} />
        </section>
      )}

      {/* ------------------------------------------------------------- Reviews */}
      {features.reviews && showTestimonials && reviews.length > 0 && (
        <section className="bg-secondary py-20 md:py-28">
          <div className="container mx-auto px-4">
            <Reveal className="mb-10 flex items-end justify-between gap-4">
              <div>
                <span className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
                  Kind words
                </span>
                <h2 className="mt-3 font-serif text-3xl font-bold md:text-5xl">
                  Loved by our clients.
                </h2>
              </div>
              {reviews.length > 1 && (
                <div className="hidden gap-2 sm:flex">
                  <button
                    onClick={() => scrollReviews(-1)}
                    aria-label="Previous reviews"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition hover:bg-accent"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => scrollReviews(1)}
                    aria-label="Next reviews"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition hover:bg-accent"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </Reveal>

            <div
              ref={reviewsRef}
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {reviews.map((r) => (
                <figure
                  key={r.id}
                  className="w-[85%] shrink-0 snap-start rounded-2xl border border-border bg-card p-7 sm:w-[46%] lg:w-[31%]"
                >
                  <Quote className="h-8 w-8 text-primary/30" />
                  <blockquote className="mt-4 font-serif text-lg leading-snug">
                    “{r.content}”
                  </blockquote>
                  <figcaption className="mt-5 text-sm">
                    <span className="font-medium">
                      {r.profiles?.full_name ?? "Client"}
                    </span>
                    {r.services?.name && (
                      <span className="text-muted-foreground"> · {r.services.name}</span>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- Loyalty */}
      {features.loyalty && (
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <Reveal className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-accent/50 to-card p-10 text-center md:p-14">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Gift className="h-7 w-7 text-primary" />
              </span>
              <div>
                <span className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
                  Love coming back?
                </span>
                <h2 className="mt-3 font-serif text-3xl font-bold md:text-4xl">
                  Earn rewards every time you visit.
                </h2>
                <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                  Collect points on every appointment and redeem them for money
                  off future visits — our way of saying thank you.
                </p>
              </div>
              <Button className="group" asChild>
                <Link to="/account">
                  Join & earn points
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </Reveal>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ Products */}
      {shopEnabled && featuredProducts.length > 0 && (
        <section className="bg-secondary py-20 md:py-28">
          <div className="container mx-auto px-4">
            <Reveal className="mb-12 flex items-end justify-between gap-4">
              <div>
                <span className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
                  Shop the studio
                </span>
                <h2 className="mt-3 font-serif text-3xl font-bold md:text-5xl">
                  Take the studio home.
                </h2>
              </div>
              <Button variant="outline" className="hidden group sm:inline-flex" asChild>
                <Link to="/shop">
                  <ShoppingBag className="mr-2 h-4 w-4" /> Visit the shop
                </Link>
              </Button>
            </Reveal>
            <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {featuredProducts.map((product, i) => (
                <Reveal key={product.id} delay={(i % 4) * 70}>
                  <Link
                    to={`/shop/${product.id}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="aspect-square overflow-hidden bg-muted">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Sparkles className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-1 font-medium transition-colors group-hover:text-primary">
                        {product.name}
                      </h3>
                      <p className="mt-1 font-semibold text-primary">
                        {product.on_promo ? GHS(product.effective_price) : GHS(product.price)}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------- Booking CTA */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <img src={ctaBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <Reveal>
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-background/80">
              Ready for your next look?
            </span>
            <h2 className="mx-auto mt-3 max-w-2xl font-serif text-3xl font-bold text-background md:text-5xl">
              Your next beauty appointment is just a few clicks away.
            </h2>
            <Button size="lg" variant="secondary" className="group mt-8" asChild>
              <Link to="/book">
                Book your appointment
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- Contact */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto grid grid-cols-1 gap-12 px-4 lg:grid-cols-2">
          <Reveal>
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              Visit us
            </span>
            <h2 className="mt-3 font-serif text-3xl font-bold md:text-5xl">
              Come say hello.
            </h2>
            <div className="mt-8 space-y-4 text-sm">
              {contact?.showPhone && contact.phone && (
                <ContactRow icon={<Phone className="h-5 w-5" />} label="Phone">
                  <a href={`tel:${contact.phone}`} className="hover:text-primary">
                    {contact.phone}
                  </a>
                </ContactRow>
              )}
              {contact?.showWhatsapp && contact.whatsapp && (
                <ContactRow icon={<WhatsappIcon className="h-5 w-5" />} label="WhatsApp">
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
                <ContactRow icon={<Mail className="h-5 w-5" />} label="Email">
                  <a href={`mailto:${contact.email}`} className="hover:text-primary">
                    {contact.email}
                  </a>
                </ContactRow>
              )}
              {contact?.showInstagram && contact.instagram && (
                <ContactRow icon={<Instagram className="h-5 w-5" />} label="Instagram">
                  <a
                    href={socialHref("instagram", contact.instagram)}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary"
                  >
                    @{contact.instagram.replace(/^@/, "")}
                  </a>
                </ContactRow>
              )}
              {contact?.showTiktok && contact.tiktok && (
                <ContactRow icon={<Music2 className="h-5 w-5" />} label="TikTok">
                  <a
                    href={socialHref("tiktok", contact.tiktok)}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary"
                  >
                    @{contact.tiktok.replace(/^@/, "")}
                  </a>
                </ContactRow>
              )}
              {contact?.showFacebook && contact.facebook && (
                <ContactRow icon={<Facebook className="h-5 w-5" />} label="Facebook">
                  <a
                    href={socialHref("facebook", contact.facebook)}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary"
                  >
                    {contact.facebook.replace(/^https?:\/\/(www\.)?facebook\.com\//, "").replace(/^@/, "")}
                  </a>
                </ContactRow>
              )}
              {contact?.showAddress && contact.address && (
                <ContactRow icon={<MapPin className="h-5 w-5" />} label="Address">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      contact.address,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary"
                  >
                    {contact.address}
                  </a>
                </ContactRow>
              )}
            </div>
          </Reveal>

          {hours.length > 0 && (
            <Reveal delay={100} className="rounded-2xl border border-border bg-card p-7">
              <h3 className="flex items-center gap-2 font-serif text-lg font-semibold">
                <Clock className="h-5 w-5 text-primary" /> Opening hours
              </h3>
              <ul className="mt-5 space-y-2.5 text-sm">
                {[...hours]
                  .sort((a, b) => a.day_of_week - b.day_of_week)
                  .map((h) => (
                    <li key={h.id} className="flex justify-between border-b border-border/60 pb-2.5 last:border-0">
                      <span className="text-muted-foreground">{DAYS[h.day_of_week]}</span>
                      <span className="font-medium">
                        {h.is_closed || !h.open_time
                          ? "Closed"
                          : `${to12h(h.open_time)} – ${to12h(h.close_time)}`}
                      </span>
                    </li>
                  ))}
              </ul>
              <Button className="group mt-6 w-full" asChild>
                <Link to="/book">
                  Book an appointment
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </Reveal>
          )}
        </div>
      </section>
    </Layout>
  );
};

const ContactRow = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-4">
    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
      {icon}
    </span>
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{children}</p>
    </div>
  </div>
);

export default Index;
