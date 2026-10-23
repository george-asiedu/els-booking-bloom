import { useState } from "react";
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
}

const price = (s: DisplayService) =>
  s.on_promo && s.promo_price != null ? s.promo_price : s.price;

const Services = () => {
  const { name: studioName } = useStudio();
  const [activeCat, setActiveCat] = useState<string>("all");

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
        <div className="container mx-auto max-w-4xl px-4">
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
            <>
              {tabSlugs.length > 1 && (
                <div
                  className="mb-8 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  role="tablist"
                  aria-label="Service categories"
                >
                  {["all", ...tabSlugs].map((slug) => (
                    <button
                      key={slug}
                      role="tab"
                      aria-selected={activeCat === slug}
                      onClick={() => setActiveCat(slug)}
                      className={cn(
                        "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        activeCat === slug
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {slug === "all" ? "Everything" : catName(slug)}
                    </button>
                  ))}
                </div>
              )}

              {/* The price list. Price and length stay visible at every width:
                  on a phone they're what people came for. */}
              <ul className="divide-y divide-border border-y border-border">
                {filtered.map((s) => (
                  <li
                    key={s.id}
                    className="grid grid-cols-[1fr,auto] items-baseline gap-x-6 gap-y-1 py-5"
                  >
                    <div className="min-w-0">
                      <h3 className="font-serif text-lg font-semibold">
                        {s.name}
                        {s.popular && (
                          <span className="ml-2 align-middle text-xs font-medium text-muted-foreground">
                            Popular
                          </span>
                        )}
                        {s.on_promo && s.promo_price != null && (
                          <span className="ml-2 align-middle text-xs font-medium text-primary">
                            On offer
                          </span>
                        )}
                      </h3>
                      {s.description && (
                        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                          {s.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">
                        {s.on_promo && s.promo_price != null && (
                          <span className="mr-2 font-normal text-muted-foreground line-through">
                            {GHS(s.price)}
                          </span>
                        )}
                        {GHS(price(s))}
                      </p>
                      <p className="text-sm text-muted-foreground">{s.duration}</p>
                    </div>
                    <Link
                      to="/book"
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Book {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
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
