import { SearchBox } from "@/components/ui/search-box";
import { useSeo } from "@/lib/seo";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Star, Store } from "lucide-react";
import { NavSection } from "./landing/LandingNav";
import { FooterSection } from "./landing/ClosingSections";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/apiClient";
import { studioUrl } from "@/config/platform";
import { useHideSplashWhen } from "@/lib/splash";
import { cn } from "@/lib/utils";

interface Listing {
  name: string;
  slug: string;
  kind: "studio" | "store";
  shopCategory: string | null;
  area: string | null;
  about: string | null;
  logoUrl: string | null;
  photoUrl: string | null;
  topServices: string[];
  rating: number | null;
  reviews: number;
}

const KINDS = [
  { key: "", label: "Everything" },
  { key: "studio", label: "Book a service" },
  { key: "store", label: "Shops" },
] as const;

/** The public directory: every business on Zuri, searchable by name, area or service. */
const Discover = () => {
  // ?q= and ?kind= make a search shareable and let search engines link
  // straight to results (the site's SearchAction points here).
  const [params, setParams] = useSearchParams();
  const initialKind = params.get("kind");
  const [kind, setKind] = useState<"" | "studio" | "store">(
    initialKind === "studio" || initialKind === "store" ? initialKind : "",
  );
  // SearchBox waits for a pause and 3 characters before setting this.
  const [term, setTerm] = useState(params.get("q") ?? "");
  useEffect(() => {
    const next = new URLSearchParams();
    if (term) next.set("q", term);
    if (kind) next.set("kind", kind);
    setParams(next, { replace: true });
  }, [term, kind, setParams]);
  const { data = [], isLoading, isFetching } = useQuery({
    queryKey: ["directory", term, kind],
    queryFn: async () =>
      (
        await apiRequest<{ data: Listing[] }>(
          `/platform/directory?${new URLSearchParams({ ...(term ? { q: term } : {}), ...(kind ? { kind } : {}) })}`,
        )
      ).data,
    placeholderData: (prev) => prev,
  });
  useHideSplashWhen(!isLoading);
  useSeo({
    title: "Zuri Marketplace: book beauty studios and shop online in Ghana",
    description:
      "Find salons, barbers, nail, lash and beauty studios and online shops across Ghana. Compare reviews, then book or buy and pay by Mobile Money or card.",
    structuredData: data.length
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Businesses on the Zuri marketplace",
          itemListElement: data.slice(0, 30).map((b, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: studioUrl(b.slug),
            name: b.name,
          })),
        }
      : undefined,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavSection solid />
      <main className="container mx-auto px-4 pb-20 pt-36">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">The Zuri marketplace</p>
        <h1 className="mt-2 max-w-2xl text-balance font-serif text-4xl font-semibold leading-tight md:text-5xl">Find a studio to book or a shop to buy from</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Salons, barbers, nail, lash and beauty studios, and online shops across Ghana, all in one place. Compare reviews,
          then book or buy on the business&apos;s own website and pay by Mobile Money or card.
        </p>

        <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
          <SearchBox
            value={term}
            onSearch={setTerm}
            busy={isFetching && Boolean(term)}
            placeholder="Search by name, area, service or product"
            label="Search businesses"
            className="flex-1 md:max-w-md"
            inputClassName="h-11"
          />
          <div className="flex gap-2" role="tablist" aria-label="What you're looking for">
            {KINDS.map((k) => (
              <button
                key={k.key}
                type="button"
                role="tab"
                aria-selected={kind === k.key}
                onClick={() => setKind(k.key)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium",
                  kind === k.key ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50",
                )}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)
            : data.map((b) => (
                <a
                  key={b.slug}
                  href={studioUrl(b.slug)}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
                >
                  <span className="relative block aspect-[16/10] overflow-hidden bg-muted">
                    {b.photoUrl ? (
                      <img src={b.photoUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-muted-foreground">
                        <Store className="h-10 w-10" />
                      </span>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium">
                      {b.kind === "store" ? "Shop" : "Book online"}
                    </span>
                  </span>
                  <span className="block p-5">
                    <span className="flex items-center gap-3">
                      {b.logoUrl && <img src={b.logoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />}
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{b.name}</span>
                        {b.area && (
                          <span className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden /> {b.area}
                          </span>
                        )}
                      </span>
                    </span>
                    {b.rating !== null && (
                      <span className="mt-3 flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                        <span className="font-medium tabular-nums">{b.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({b.reviews} {b.reviews === 1 ? "review" : "reviews"})</span>
                      </span>
                    )}
                    {b.topServices.length > 0 && (
                      <span className="mt-3 flex flex-wrap gap-1.5">
                        {b.topServices.map((t) => (
                          <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                            {t}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                </a>
              ))}
        </div>
        {!isLoading && data.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="font-medium">No businesses match that yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different area or service.</p>
          </div>
        )}
      </main>
      <FooterSection />
    </div>
  );
};

export default Discover;
