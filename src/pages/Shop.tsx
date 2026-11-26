import { useEffect, useMemo, useState } from "react";
import { productListSchema, useSeo } from "@/lib/seo";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ShopLayout as Layout } from "@/components/shop/ShopLayout";
import { Breadcrumbs, ProductCard } from "@/components/shop/ProductCard";
import { commerceApi, productCategoriesApi, productsApi, type ProductDTO } from "@/lib/api";
import { useHideSplashWhen } from "@/lib/splash";
import { useStudio } from "@/hooks/useStudio";
import { formatGHS } from "@/lib/currency";
import { cn } from "@/lib/utils";

const PER_PAGE = 12;
type Sort = "newest" | "recommended" | "low" | "high";

const AUDIENCES = { men: "MEN", women: "WOMEN" } as const;
type AudienceParam = keyof typeof AUDIENCES;
/** Men's pages show men's and everyone's pieces; women's likewise. */
const forAudience = (p: ProductDTO, a: AudienceParam | null) => !a || p.audience === "UNISEX" || p.audience === AUDIENCES[a];
// Best rated, then marked popular, then newest.
const recommended = (a: ProductDTO, b: ProductDTO) =>
  (b.rating_average ?? 0) - (a.rating_average ?? 0) || Number(b.popular) - Number(a.popular);

/** All products (categories-design): filters beside a paged grid. */
const Shop = () => {
  const { isLoading: studioLoading, name: shopName } = useStudio();
  const [params] = useSearchParams();
  const query = (params.get("q") ?? "").trim().toLowerCase();
  const brand = params.get("brand");
  const audienceRaw = params.get("audience");
  const audience: AudienceParam | null = audienceRaw === "men" || audienceRaw === "women" ? audienceRaw : null;
  const [cats, setCats] = useState<string[]>([]);
  const [range, setRange] = useState<[number, number] | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [inStock, setInStock] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);

  // The header's category links and the home page's circles land here.
  useEffect(() => {
    const c = params.get("category");
    setCats(c ? [c] : []);
    setOnSale(params.get("sale") === "1");
    setPage(1);
  }, [params]);

  const { data: commerce } = useQuery({
    queryKey: ["commerce-settings"],
    queryFn: () => commerceApi.getSettings(),
  });
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => productsApi.listActive(),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["public-product-categories"],
    queryFn: () => productCategoriesApi.listActive(),
  });
  useSeo({
    title: `Shop all products · ${shopName}`,
    description: products.length
      ? `Shop ${products.length} products from ${shopName}, including ${products.slice(0, 4).map((p) => p.name).join(", ")}. Pay by Mobile Money or card, with delivery or pickup.`
      : `Shop online with ${shopName}. Pay by Mobile Money or card, with delivery or pickup.`,
    structuredData: products.length ? productListSchema(shopName, products) : null,
  });
  useHideSplashWhen(!studioLoading && !isLoading);

  const maxPrice = useMemo(
    () => Math.ceil(Math.max(0, ...products.map((p) => p.effective_price))),
    [products],
  );
  const [lo, hi] = range ?? [0, maxPrice];

  const matches = products.filter(
    (p) =>
      forAudience(p, audience) &&
      (!brand || p.brand === brand) &&
      (!query || p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)) &&
      p.effective_price >= lo &&
      p.effective_price <= hi &&
      (!size || p.sizes.includes(size)) &&
      (!color || p.colors.some((c) => c.name === color)) &&
      (!inStock || p.in_stock) &&
      (!onSale || p.on_promo),
  );
  const pool = products.filter((p) => forAudience(p, audience));
  const allSizes = [...new Set(pool.flatMap((p) => p.sizes))];
  const allColors = [...new Map(pool.flatMap((p) => p.colors).map((c) => [c.name, c])).values()];
  // Only categories with something in them for this audience.
  const shownCategories = categories.filter((c) => pool.some((p) => p.category === c.slug));
  const filtered = matches.filter((p) => !cats.length || cats.includes(p.category));
  const sorted = [...filtered].sort((a, b) =>
    sort === "low"
      ? a.effective_price - b.effective_price
      : sort === "high"
        ? b.effective_price - a.effective_price
        : sort === "recommended"
          ? recommended(a, b)
          : (b.created_at ?? "").localeCompare(a.created_at ?? ""),
  );
  const pages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const current = Math.min(page, pages);
  const shown = sorted.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const single = cats.length === 1 ? categories.find((c) => c.slug === cats[0]) : null;
  const who = audience === "men" ? "Men's" : audience === "women" ? "Women's" : null;
  const title = query
    ? `Results for "${query}"`
    : brand
      ? brand
    : single
      ? who
        ? `${who} ${single.name.toLowerCase()}`
        : single.name
      : who
        ? `${who} collection`
        : "All products";
  const clear = () => {
    setCats([]);
    setRange(null);
    setSize(null);
    setColor(null);
    setInStock(false);
    setOnSale(false);
    setPage(1);
  };
  const changed = (fn: () => void) => {
    fn();
    setPage(1);
  };

  if (commerce && !commerce.enabled) {
    return (
      <Layout>
        <section className="container mx-auto max-w-md px-4 py-24 text-center">
          <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="mb-2 font-serif text-2xl font-bold">The shop is currently closed</h1>
          <p className="mb-6 text-muted-foreground">Please check back soon.</p>
          <Button asChild><Link to="/">Back to home</Link></Button>
        </section>
      </Layout>
    );
  }

  const section = "border-b border-border px-5 py-5";
  const heading = "mb-4 text-sm font-semibold text-foreground";
  const filters = (
    <div className="overflow-hidden rounded-2xl border border-border bg-card text-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <span className="font-semibold">Filter</span>
        <button type="button" onClick={clear} className="text-xs text-muted-foreground hover:text-foreground">
          Clear all
        </button>
      </div>
      {shownCategories.length > 0 && (
        <div className={section}>
          <ul className="space-y-1">
            {shownCategories.map((c) => {
              const on = cats.includes(c.slug);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => changed(() => setCats(on ? cats.filter((x) => x !== c.slug) : [...cats, c.slug]))}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent",
                      on ? "font-medium text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <span>{c.name}</span>
                    <span className="flex items-center gap-1 text-xs tabular-nums">
                      {matches.filter((p) => p.category === c.slug).length}
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {maxPrice > 0 && (
        <div className={section}>
          <p className={heading}>Price</p>
          <Slider
            min={0}
            max={maxPrice}
            step={1}
            value={[lo, hi]}
            onValueChange={(v) => changed(() => setRange([v[0], v[1]]))}
            aria-label="Price range"
          />
          <div className="mt-4 flex justify-between gap-3 text-xs tabular-nums">
            <span className="rounded-lg border border-border px-3 py-1.5">{formatGHS(lo)}</span>
            <span className="rounded-lg border border-border px-3 py-1.5">{formatGHS(hi)}</span>
          </div>
        </div>
      )}
      {allColors.length > 0 && (
        <div className={section}>
          <p className={heading}>Colours</p>
          <div className="grid grid-cols-4 gap-x-2 gap-y-3">
            {allColors.map((c) => (
              <button
                key={c.name}
                type="button"
                aria-pressed={color === c.name}
                onClick={() => changed(() => setColor(color === c.name ? null : c.name))}
                className="flex flex-col items-center gap-1"
              >
                <span
                  className={cn(
                    "h-8 w-8 rounded-lg border border-border ring-offset-2 ring-offset-card",
                    color === c.name && "ring-2 ring-foreground",
                  )}
                  style={{ backgroundColor: c.hex }}
                />
                <span className="line-clamp-1 text-[11px] text-muted-foreground">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {allSizes.length > 0 && (
        <div className={section}>
          <p className={heading}>Size</p>
          <div className="grid grid-cols-3 gap-2">
            {allSizes.map((sz) => (
              <button
                key={sz}
                type="button"
                aria-pressed={size === sz}
                onClick={() => changed(() => setSize(size === sz ? null : sz))}
                className={cn(
                  "h-9 rounded-lg border text-xs",
                  size === sz ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground",
                )}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="px-5 py-5">
        <p className={heading}>Availability</p>
        <div className="space-y-2.5">
          <label className="flex cursor-pointer items-center gap-2.5">
            <Checkbox checked={inStock} onCheckedChange={(on) => changed(() => setInStock(!!on))} /> In stock
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <Checkbox checked={onSale} onCheckedChange={(on) => changed(() => setOnSale(!!on))} /> On sale
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <section className="container mx-auto grid gap-8 px-4 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>
        <div>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <Breadcrumbs items={[{ label: "Shop", to: "/shop/products" }, ...(who ? [{ label: who.replace("'s", "") , to: `/shop/products?audience=${audience}` }] : []), { label: title }]} />
              <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="mr-2 h-4 w-4" /> Filter
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="overflow-y-auto">
                  <SheetHeader><SheetTitle>Filter</SheetTitle></SheetHeader>
                  <div className="mt-6">{filters}</div>
                </SheetContent>
              </Sheet>
              {/* New and Recommended as text tabs, as in the design; price sorts in the menu. */}
              <div className="flex items-center gap-4 text-sm" role="tablist" aria-label="Sort">
                {(["newest", "recommended"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={sort === k}
                    onClick={() => setSort(k)}
                    className={cn("font-medium", sort === k ? "text-foreground underline decoration-primary decoration-2 underline-offset-8" : "text-muted-foreground hover:text-foreground")}
                  >
                    {k === "newest" ? "New" : "Recommended"}
                  </button>
                ))}
              </div>
              <Select value={sort === "low" || sort === "high" ? sort : ""} onValueChange={(v) => setSort(v as Sort)}>
                <SelectTrigger className="h-9 w-32" aria-label="Sort by price"><SelectValue placeholder="Price" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Price: low to high</SelectItem>
                  <SelectItem value="high">Price: high to low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[4/5]" />)}
            </div>
          ) : shown.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-serif text-xl">Nothing matches those filters</p>
              <Button variant="outline" className="mt-4" onClick={clear}>Clear filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6">
              {shown.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {pages > 1 && (
            <nav aria-label="Pages" className="mt-10 flex items-center justify-center gap-1 text-sm">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-current={n === current ? "page" : undefined}
                  onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className={cn("h-10 w-10 rounded-lg", n === current ? "bg-primary text-primary-foreground" : "hover:bg-accent")}
                >
                  {n}
                </button>
              ))}
              {current < pages && (
                <button type="button" onClick={() => { setPage(current + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="h-10 px-3 hover:bg-accent">Next →</button>
              )}
            </nav>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Shop;
