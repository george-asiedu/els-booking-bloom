import { SearchBox } from "@/components/ui/search-box";
import { useSeo } from "@/lib/seo";
import { useState } from "react";
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
  const [kind, setKind] = useState<"" | "studio" | "store">("");
  // SearchBox waits for a pause and 3 characters before setting this.
  const [term, setTerm] = useState("");
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
    title: "Find a business on Zuri · Zuri Studios",
    description: "Studios you can book and shops you can buy from, all on Zuri Studios. Pay directly by Mobile Money or card.",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavSection solid />
      <main className="container mx-auto px-4 pb-20 pt-36">
        <h1 className="max-w-2xl text-balance font-serif text-4xl font-semibold leading-tight md:text-5xl">Find a business on Zuri</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Studios you can book and shops you can buy from, all on Zuri. Pay directly by Mobile Money or card.
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
