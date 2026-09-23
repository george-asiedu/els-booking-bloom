import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/Reveal";
import { StudioPageHero } from "@/components/storefront/StudioPageHero";
import { services as staticServices } from "@/data/services";
import { servicesApi, categoriesApi, galleryApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const GHS = (n: number) => `GH₵ ${n.toLocaleString()}`;
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

  const source: DisplayService[] =
    apiServices && apiServices.length > 0 ? apiServices : staticServices;

  const nameBySlug = new Map((categoriesData ?? []).map((c) => [c.slug, c.name]));
  const catName = (slug: string) => nameBySlug.get(slug) ?? titleize(slug);

  const present = Array.from(new Set(source.map((s) => s.category)));
  const orderedSlugs = (categoriesData ?? []).map((c) => c.slug);
  const tabSlugs = [
    ...orderedSlugs.filter((s) => present.includes(s)),
    ...present.filter((s) => !orderedSlugs.includes(s)),
  ];

  const featured = useMemo(
    () => source.filter((s) => s.popular).slice(0, 2),
    [source],
  );
  const filtered =
    activeCat === "all" ? source : source.filter((s) => s.category === activeCat);

  const heroImg = gallery[0]?.image_url ?? null;
  const ctaImg = gallery[2]?.image_url ?? gallery[0]?.image_url ?? null;

  return (
    <Layout>
      <StudioPageHero
        eyebrow="Our services"
        title={
          <>
            Your next look
            <br />
            <span className="text-primary">starts here.</span>
          </>
        }
        description="Beauty experiences designed around you — from everyday essentials to your next signature look."
        image={heroImg}
        variant="editorial"
        cta={{ label: "Book an appointment", to: "/book" }}
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : source.length === 0 ? (
            <div className="mx-auto max-w-md py-16 text-center">
              <Sparkles className="mx-auto mb-4 h-10 w-10 text-primary/40" />
              <h2 className="font-serif text-2xl font-bold">
                We're preparing something special.
              </h2>
              <p className="mt-2 text-muted-foreground">
                Services will be available soon.
              </p>
              <Button className="mt-6" asChild>
                <Link to="/contact">Contact studio</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Featured */}
              {featured.length >= 2 && activeCat === "all" && (
                <div className="mb-14">
                  <Reveal className="mb-6">
                    <span className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
                      Most loved
                    </span>
                  </Reveal>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {featured.map((s, i) => (
                      <Reveal
                        key={s.id}
                        delay={i * 100}
                        className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-br from-accent/40 to-card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div>
                          <h3 className="font-serif text-xl font-semibold">{s.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {s.duration} · from {GHS(price(s))}
                          </p>
                        </div>
                        <Button size="sm" className="group/btn shrink-0" asChild>
                          <Link to="/book">
                            Book
                            <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                          </Link>
                        </Button>
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}

              {/* Category filter — horizontally scrollable on mobile */}
              <div className="mb-10 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {["all", ...tabSlugs].map((slug) => (
                  <button
                    key={slug}
                    onClick={() => setActiveCat(slug)}
                    className={cn(
                      "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                      activeCat === slug
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {slug === "all" ? "All" : catName(slug)}
                  </button>
                ))}
              </div>

              {/* Editorial rows */}
              <div className="mx-auto max-w-4xl divide-y divide-border border-y border-border">
                {filtered.map((s, i) => (
                  <Reveal
                    key={s.id}
                    delay={(i % 4) * 60}
                    className="group grid grid-cols-[auto,1fr,auto] items-center gap-4 py-6 sm:gap-6"
                  >
                    <span className="font-serif text-sm text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-lg font-semibold transition-colors group-hover:text-primary">
                          {s.name}
                        </h3>
                        {s.popular && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            Popular
                          </span>
                        )}
                        {s.on_promo && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                            style={{ backgroundColor: "hsl(var(--toast-success))" }}
                          >
                            Promo
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {s.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="hidden text-right sm:block">
                        {s.on_promo && s.promo_price != null ? (
                          <p className="text-sm font-semibold">
                            <span className="mr-1 text-xs font-normal text-muted-foreground line-through">
                              {GHS(s.price)}
                            </span>
                            {GHS(s.promo_price)}
                          </p>
                        ) : (
                          <p className="text-sm font-semibold">{GHS(s.price)}</p>
                        )}
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
            </>
          )}
        </div>
      </section>

      {/* Booking CTA */}
      <section className="relative overflow-hidden py-24">
        <img
          src={ctaImg ?? undefined}
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            !ctaImg && "hidden",
          )}
        />
        <div className={cn("absolute inset-0", ctaImg ? "bg-foreground/60" : "bg-secondary")} />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <Reveal>
            <span
              className={cn(
                "text-sm font-medium uppercase tracking-[0.2em]",
                ctaImg ? "text-background/80" : "text-primary",
              )}
            >
              Ready for your next appointment?
            </span>
            <h2
              className={cn(
                "mx-auto mt-3 max-w-2xl font-serif text-3xl font-bold md:text-4xl",
                ctaImg ? "text-background" : "text-foreground",
              )}
            >
              Find a service that fits your style.
            </h2>
            <Button
              size="lg"
              variant={ctaImg ? "secondary" : "default"}
              className="group mt-8"
              asChild
            >
              <Link to="/book">
                Book an appointment
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
