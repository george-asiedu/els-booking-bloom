import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin, Search, Star, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { apiRequest } from "@/lib/apiClient";
import { studioUrl } from "@/config/platform";

interface Listing {
  name: string;
  slug: string;
  kind: "studio" | "store";
  area: string | null;
  photoUrl: string | null;
  logoUrl: string | null;
  rating: number | null;
  reviews: number;
}

const POINTS = [
  {
    icon: Search,
    title: "Found by new customers",
    text: "People search the marketplace by name, area, service or product, and find you there.",
  },
  {
    icon: Users,
    title: "Listed for free, on every plan",
    text: "Every studio and shop on Zuri appears in the marketplace automatically. Nothing extra to pay.",
  },
  {
    icon: Store,
    title: "They book or buy on your site",
    text: "Customers go straight to your own website, so the booking, the payment and the customer are yours.",
  },
];

/**
 * The Zuri marketplace (/discover): every business on Zuri in one searchable
 * place. Tells owners they are listed on every plan, shows a few real
 * listings, and links to it with plain, descriptive anchor text so search
 * engines understand the page.
 */
export const MarketplaceSection = () => {
  // The directory is public and cached by the API, so this is cheap.
  const { data: listings = [] } = useQuery({
    queryKey: ["directory-preview"],
    queryFn: async () => (await apiRequest<{ data: Listing[] }>("/platform/directory?limit=3")).data.slice(0, 3),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <section id="marketplace" aria-labelledby="marketplace-heading" className="scroll-mt-24 py-16 md:py-24">
      <div className="container mx-auto grid items-center gap-10 px-4 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">The Zuri marketplace</p>
          <h2 id="marketplace-heading" className="mt-3 text-balance font-serif text-3xl font-semibold md:text-5xl">
            Get found by customers looking for you
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            The Zuri marketplace lists beauty studios, salons, barbers and online shops across Ghana in one place.
            Customers search by area or service, compare reviews, then book or buy on the business&apos;s own website.
            Every plan includes a free listing.
          </p>
          <ul className="mt-6 space-y-4">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <p.icon className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold">{p.title}</span>
                  <span className="block text-sm text-muted-foreground">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-full px-7" asChild>
              <Link to="/discover">
                Explore the marketplace <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-7" asChild>
              <Link to="/onboarding">List your business</Link>
            </Button>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="rounded-3xl border border-border bg-secondary/50 p-4 sm:p-6">
            <Link
              to="/discover"
              className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-3 text-sm text-muted-foreground hover:border-primary/50"
            >
              <Search className="h-4 w-4" aria-hidden /> Search by name, area, service or product
            </Link>
            <ul className="mt-4 space-y-3">
              {(listings.length ? listings : Array.from({ length: 3 }, () => null)).map((b, i) => (
                <li key={b?.slug ?? i}>
                  {b ? (
                    <a
                      href={studioUrl(b.slug)}
                      className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition-shadow hover:shadow-md"
                    >
                      <span className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {(b.photoUrl || b.logoUrl) && (
                          <img src={b.photoUrl ?? b.logoUrl ?? ""} alt="" loading="lazy" className="h-full w-full object-cover" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{b.name}</span>
                        <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                          {b.area && (
                            <>
                              <MapPin className="h-3 w-3 shrink-0" aria-hidden /> {b.area} ·{" "}
                            </>
                          )}
                          {b.kind === "store" ? "Shop online" : "Book online"}
                        </span>
                        {b.rating !== null && (
                          <span className="mt-1 flex items-center gap-1 text-xs">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                            <span className="tabular-nums">{b.rating.toFixed(1)}</span>
                            <span className="text-muted-foreground">({b.reviews})</span>
                          </span>
                        )}
                      </span>
                    </a>
                  ) : (
                    <span className="block h-[88px] animate-pulse rounded-2xl bg-muted" aria-hidden />
                  )}
                </li>
              ))}
            </ul>
            <Link to="/discover" className="mt-4 block text-center text-sm font-medium text-primary hover:underline">
              See every business on Zuri
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
