import { useState } from "react";
import { servicesSchema, useSeo } from "@/lib/seo";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { StudioPageHero } from "@/components/storefront/StudioPageHero";
import { servicesApi, categoriesApi, galleryApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatGHS } from "@/lib/currency";
import { useStudio } from "@/hooks/useStudio";

const GHS = formatGHS;
const PER_PAGE = 9;
const titleize = (slug: string) =>
  slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

interface DisplayService {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  promo_price?: number | null;
  on_promo?: boolean;
  popular?: boolean;
  category: string;
  image_url?: string | null;
}

const price = (s: DisplayService) =>
  s.on_promo && s.promo_price != null ? s.promo_price : s.price;

const Services = () => {
  const { name: studioName } = useStudio();
  const [activeCat, setActiveCat] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data: apiServices, isLoading } = useQuery({
    queryKey: ["public-services-catalog"],
    queryFn: () => servicesApi.listActive(),
  });
  const { data: categoriesData } = useQuery({
    queryKey: ["public-categories"],
    queryFn: () => categoriesApi.listActive(),
  });
  const { data: gallery = [] } = useQuery({
    queryKey: ["public-gallery"],
    queryFn: () => galleryApi.listActive(),
  });

  const source: DisplayService[] = apiServices ?? [];

  const nameBySlug = new Map((categoriesData ?? []).map((c) => [c.slug, c.name]));
  const catName = (slug: string) => nameBySlug.get(slug) ?? titleize(slug);

  const present = Array.from(new Set(source.map((s) => s.category)));
  const orderedSlugs = (categoriesData ?? []).map((c) => c.slug);
  const tabSlugs = [
    ...orderedSlugs.filter((s) => present.includes(s)),
    ...present.filter((s) => !orderedSlugs.includes(s)),
  ];

  const filtered =
    activeCat === "all" ? source : source.filter((s) => s.category === activeCat);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, pages);
  const pageItems = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  useSeo({
    title: `Services and prices · ${studioName}`,
    description: source.length
      ? `${studioName}: ${source.slice(0, 6).map((s) => s.name).join(", ")}. See prices and how long each takes, then book online.`
      : `See ${studioName}'s services and prices, and book online.`,
    structuredData: source.length ? servicesSchema(studioName, source) : null,
  });

  const galleryPhotos = gallery.filter((g) => g.media_type === "image");
  const heroImg = galleryPhotos[0]?.image_url ?? null;
  const ctaImg = galleryPhotos[2]?.image_url ?? galleryPhotos[0]?.image_url ?? null;

  return (
    <Layout>
      <StudioPageHero
        eyebrow={studioName}
        title="Services and prices"
        description="Everything we offer, what it costs and how long it takes. Prices are per appointment."
        image={heroImg}
        variant="editorial"
        cta={{ label: "Book an appointment", to: "/book" }}
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : source.length === 0 ? (
            <div className="py-16">
              <h2 className="font-serif text-2xl font-semibold">No services listed yet</h2>
              <p className="mt-2 max-w-md text-muted-foreground">
                {studioName} hasn't added its services here yet. Get in touch and we'll tell you
                what we offer and what it costs.
              </p>
              <Button className="mt-6" asChild>
                <Link to="/contact">Contact us</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
              {/* Categories: a list on the left on large screens, pills above on phones */}
              {tabSlugs.length > 1 && (
                <nav aria-label="Service categories" className="lg:sticky lg:top-[calc(var(--site-header-h,5rem)+1.5rem)] lg:self-start">
                  <p className="mb-3 hidden text-xs uppercase tracking-wider text-muted-foreground lg:block">Categories</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
                    {["all", ...tabSlugs].map((slug) => {
                      const count = slug === "all" ? source.length : source.filter((x) => x.category === slug).length;
                      return (
                        <button
                          key={slug}
                          type="button"
                          aria-pressed={activeCat === slug}
                          onClick={() => { setActiveCat(slug); setPage(1); }}
                          className={cn(
                            "flex shrink-0 items-center justify-between gap-3 rounded-full border px-4 py-2 text-sm font-medium transition-colors lg:rounded-md lg:border-0 lg:px-3",
                            activeCat === slug
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                          )}
                        >
                          {slug === "all" ? "Everything" : catName(slug)}
                          <span className="text-xs tabular-nums opacity-70">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </nav>
              )}

              <div className={tabSlugs.length > 1 ? "" : "lg:col-span-2"}>
                <p className="mb-5 text-sm text-muted-foreground">
                  Showing {(current - 1) * PER_PAGE + 1}–{Math.min(current * PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {pageItems.map((s) => (
                    <article key={s.id} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                        {s.image_url ? (
                          <img src={s.image_url} alt={s.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
                        ) : (
                          <div className="flex h-full items-center justify-center font-serif text-3xl text-muted-foreground/50">{s.name.charAt(0)}</div>
                        )}
                        {(s.popular || (s.on_promo && s.promo_price != null)) && (
                          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground">
                            {s.on_promo && s.promo_price != null ? "On offer" : "Popular"}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="font-serif text-lg font-semibold">{s.name}</h3>
                        {s.description && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>}
                        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                          <div>
                            <p className="font-semibold tabular-nums">
                              {s.on_promo && s.promo_price != null && (
                                <span className="mr-2 text-sm font-normal text-muted-foreground line-through">{GHS(s.price)}</span>
                              )}
                              {GHS(price(s))}
                            </p>
                            <p className="text-xs text-muted-foreground">{s.duration}</p>
                          </div>
                          <Button size="sm" asChild>
                            <Link to="/book" aria-label={`Book ${s.name}`}>Book</Link>
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {pages > 1 && (
                  <nav aria-label="Pages" className="mt-10 flex items-center justify-center gap-1 text-sm">
                    {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-current={n === current ? "page" : undefined}
                        onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className={cn("h-10 w-10 rounded-md", n === current ? "bg-primary text-primary-foreground" : "hover:bg-accent")}
                      >
                        {n}
                      </button>
                    ))}
                  </nav>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Closing prompt */}
      <section className="relative overflow-hidden py-20 md:py-24">
        {ctaImg && (
          <>
            <img src={ctaImg} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/55" />
          </>
        )}
        {!ctaImg && <div className="absolute inset-0 bg-secondary" />}
        <div className="container relative z-10 mx-auto max-w-4xl px-4">
          <h2
            className={cn(
              "max-w-xl font-serif text-3xl font-semibold md:text-4xl",
              ctaImg ? "text-white" : "text-foreground",
            )}
          >
            Not sure which to choose?
          </h2>
          <p className={cn("mt-3 max-w-md", ctaImg ? "text-white/85" : "text-muted-foreground")}>
            Book the closest match and add a note, or send us a message first. We're happy to help.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" variant={ctaImg ? "secondary" : "default"} asChild>
              <Link to="/book">Book an appointment</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className={ctaImg ? "border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white" : undefined}
              asChild
            >
              <Link to="/contact">Ask a question</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
