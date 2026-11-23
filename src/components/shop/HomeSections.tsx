import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import type { CategoryDTO, ProductDTO } from "@/lib/api";
import { formatGHS } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";

// The storefront home page's sections (after the Euphoria-style design): a
// title with a bar, then the section. Every section builds itself from the
// shop's own products and hides when there's nothing to show.

export const SectionTitle = ({ children, action }: { children: string; action?: { label: string; to: string } }) => (
  <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
    <h2 className="border-l-4 border-primary pl-3 text-2xl font-semibold tracking-tight md:text-3xl">{children}</h2>
    {action && (
      <Link to={action.to} className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        {action.label} <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    )}
  </div>
);

const Photo = ({ src, alt, className }: { src: string | null; alt: string; className?: string }) =>
  src ? (
    <img src={src} alt={alt} loading="lazy" className={cn("h-full w-full object-cover", className)} />
  ) : (
    <span className="flex h-full w-full items-center justify-center text-muted-foreground">
      <ImageOff className="h-8 w-8" aria-hidden />
    </span>
  );

const pct = (p: ProductDTO) => Math.round((1 - p.effective_price / p.price) * 100);

/** The newest pieces in a row that scrolls sideways, with arrows on wide screens. */
export const NewArrivals = ({ products }: { products: ProductDTO[] }) => {
  const row = useRef<HTMLDivElement>(null);
  if (!products.length) return null;
  const scroll = (dir: 1 | -1) => row.current?.scrollBy({ left: dir * row.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <SectionTitle action={{ label: "View all", to: "/shop/products" }}>New arrivals</SectionTitle>
      <div className="relative">
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Earlier pieces"
          className="absolute -left-4 top-[40%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent md:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div ref={row} className="flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none] md:gap-6">
          {products.map((p) => (
            <Link key={p.id} to={`/shop/${p.id}`} className="group w-[45%] shrink-0 snap-start sm:w-[30%] lg:w-[calc(25%-1.125rem)]">
              <span className="block aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
                <Photo src={p.image_url} alt={p.name} className="transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
              </span>
              <span className="mt-3 block truncate text-sm font-medium">{p.name}</span>
            </Link>
          ))}
        </div>
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="More pieces"
          className="absolute -right-4 top-[40%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent md:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
};

// Soft tints for the saving tiles, so each category reads as its own card.
const TINTS = [
  "from-sky-100 to-sky-200 dark:from-sky-950 dark:to-sky-900",
  "from-rose-100 to-rose-200 dark:from-rose-950 dark:to-rose-900",
  "from-stone-100 to-stone-200 dark:from-stone-900 dark:to-stone-800",
  "from-amber-100 to-amber-200 dark:from-amber-950 dark:to-amber-900",
  "from-teal-100 to-teal-200 dark:from-teal-950 dark:to-teal-900",
];

/**
 * Column spans on the six-column grid so every row is full: three across then
 * two wider (5), two rows of two (4), and so on.
 */
const spans = (count: number, i: number) => {
  const thirds = "md:col-span-2 md:min-h-[19rem]";
  const halves = "md:col-span-3 md:min-h-[17rem]";
  if (count === 1) return "md:col-span-6 md:min-h-[17rem]";
  if (count === 2 || count === 4) return halves;
  if (count === 3) return thirds;
  return i < 3 ? thirds : halves;
};

/**
 * One tile per category with pieces on sale: the biggest saving, the lowest
 * sale price, and a photo. Three across, then two wider ones.
 */
export const BigSavingZone = ({ products, categories }: { products: ProductDTO[]; categories: CategoryDTO[] }) => {
  const deals = categories
    .map((c) => {
      const onSale = products.filter((p) => p.category === c.slug && p.on_promo && p.in_stock);
      if (!onSale.length) return null;
      const best = [...onSale].sort((a, b) => pct(b) - pct(a))[0];
      return {
        c,
        best,
        upTo: pct(best),
        from: Math.min(...onSale.map((p) => p.effective_price)),
        img: onSale.find((p) => p.image_url)?.image_url ?? null,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .slice(0, 5);
  if (!deals.length) return null;

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <SectionTitle action={{ label: "All sale pieces", to: "/shop/products?sale=1" }}>Big saving zone</SectionTitle>
      <div className="grid gap-4 md:grid-cols-6 md:gap-5">
        {deals.map((d, i) => (
          <Link
            key={d.c.id}
            to={`/shop/products?category=${d.c.slug}&sale=1`}
            className={cn(
              "group relative isolate flex min-h-[15rem] overflow-hidden rounded-3xl bg-gradient-to-br",
              TINTS[i % TINTS.length],
              spans(deals.length, i),
            )}
          >
            <span className="absolute inset-y-0 right-0 -z-10 w-[55%] overflow-hidden">
              <Photo
                src={d.img}
                alt=""
                className="transition-transform duration-700 ease-out [mask-image:linear-gradient(to_right,transparent,black_35%)] group-hover:scale-[1.05]"
              />
            </span>
            <span className="flex w-[55%] flex-col justify-between p-5 md:p-6">
              <span>
                <span className="inline-block rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground">
                  Up to {d.upTo}% off
                </span>
                <span className="mt-3 block text-xl font-semibold leading-tight md:text-2xl">{d.c.name}</span>
                <span className="mt-1 block text-sm text-foreground/70">From {formatGHS(d.from)}</span>
              </span>
              <span className="mt-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:translate-y-0.5">
                  <ArrowDown className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-sm font-medium underline-offset-4 group-hover:underline">Shop now</span>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

/** Categories with pieces for men (or women), each with a photo from it. */
export const CategoriesFor = ({
  audience,
  products,
  categories,
}: {
  audience: "MEN" | "WOMEN";
  products: ProductDTO[];
  categories: CategoryDTO[];
}) => {
  const param = audience === "MEN" ? "men" : "women";
  const tiles = categories
    .map((c) => {
      const inCat = products.filter((p) => p.category === c.slug && (p.audience === audience || p.audience === "UNISEX"));
      // Prefer a photo of a piece made for this audience.
      const pick = inCat.find((p) => p.audience === audience && p.image_url) ?? inCat.find((p) => p.image_url);
      return inCat.some((p) => p.audience === audience) ? { c, img: pick?.image_url ?? null, count: inCat.length } : null;
    })
    .filter((t): t is NonNullable<typeof t> => t !== null)
    .slice(0, 8);
  if (!tiles.length) return null;

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <SectionTitle action={{ label: "View all", to: `/shop/products?audience=${param}` }}>
        {audience === "MEN" ? "Categories for men" : "Categories for women"}
      </SectionTitle>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
        {tiles.map((t) => (
          <Link key={t.c.id} to={`/shop/products?audience=${param}&category=${t.c.slug}`} className="group">
            <span className="block aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
              <Photo src={t.img} alt={t.c.name} className="transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
            </span>
            <span className="mt-3 flex items-center justify-between gap-2">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{t.c.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {t.count} {t.count === 1 ? "piece" : "pieces"}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

/**
 * The shop's brands on a dark band: each as a card with its monogram, how many
 * pieces it has and its best saving. Hidden until products have brands.
 */
export const TopBrands = ({ products }: { products: ProductDTO[] }) => {
  const brands = [...new Set(products.map((p) => p.brand).filter((b): b is string => Boolean(b)))]
    .map((name) => {
      const items = products.filter((p) => p.brand === name);
      return { name, count: items.length, upTo: Math.max(0, ...items.filter((p) => p.on_promo).map(pct)) };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  if (brands.length < 2) return null;
  const best = Math.max(...brands.map((b) => b.upTo));

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <div className="relative overflow-hidden rounded-3xl bg-band px-6 py-10 text-band-foreground md:px-12 md:py-14">
        {/* A soft glow of the shop's colour behind the cards. */}
        <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">Top brands deal</h2>
          <p className="mt-2 text-sm text-band-foreground/70">
            {best > 0 ? (
              <>
                Up to <span className="font-semibold text-primary">{best}% off</span> on the brands you love
              </>
            ) : (
              "The labels our customers come back for"
            )}
          </p>
        </div>
        <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {brands.map((b) => (
            <Link
              key={b.name}
              to={`/shop/products?brand=${encodeURIComponent(b.name)}`}
              className="group flex flex-col items-center rounded-2xl bg-background px-3 py-5 text-center text-foreground shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 font-serif text-lg font-semibold">
                {b.name
                  .split(/\s+/)
                  .filter((w) => /^[a-z0-9]/i.test(w))
                  .slice(0, 2)
                  .map((w) => w[0].toUpperCase())
                  .join("")}
              </span>
              <span className="mt-3 line-clamp-1 text-sm font-semibold">{b.name}</span>
              <span className="text-xs text-muted-foreground">
                {b.upTo > 0 ? `Up to ${b.upTo}% off` : `${b.count} ${b.count === 1 ? "piece" : "pieces"}`}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

/** What customers love: best rated and most reviewed. */
export const limelightPicks = (products: ProductDTO[]) =>
  [...products]
    .sort(
      (a, b) =>
        (b.rating_average ?? 0) - (a.rating_average ?? 0) ||
        b.rating_count - a.rating_count ||
        Number(b.popular) - Number(a.popular),
    )
    .slice(0, 4);

export const InTheLimelight = ({ products }: { products: ProductDTO[] }) => {
  const picks = limelightPicks(products);
  if (!picks.length) return null;
  return (
    <section id="limelight" className="container mx-auto scroll-mt-24 px-4 py-12 md:py-16">
      <SectionTitle action={{ label: "View all", to: "/shop/products" }}>In the limelight</SectionTitle>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
        {picks.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
};
