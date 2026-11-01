import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ShopLayout as Layout } from "@/components/shop/ShopLayout";
import { Breadcrumbs, ProductCard } from "@/components/shop/ProductCard";
import { commerceApi, productCategoriesApi, productsApi } from "@/lib/api";
import { useHideSplashWhen } from "@/lib/splash";
import { useStudio } from "@/hooks/useStudio";
import { formatGHS } from "@/lib/currency";
import { cn } from "@/lib/utils";

const PER_PAGE = 12;
type Sort = "newest" | "low" | "high" | "name";

/** All products (categories-design): filters beside a paged grid. */
const Shop = () => {
  const { isLoading: studioLoading } = useStudio();
  const [params] = useSearchParams();
  const query = (params.get("q") ?? "").trim().toLowerCase();
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
  useHideSplashWhen(!studioLoading && !isLoading);

  const maxPrice = useMemo(
    () => Math.ceil(Math.max(0, ...products.map((p) => p.effective_price))),
    [products],
  );
  const [lo, hi] = range ?? [0, maxPrice];

  const matches = products.filter(
    (p) =>
      (!query || p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)) &&
      p.effective_price >= lo &&
      p.effective_price <= hi &&
      (!size || p.sizes.includes(size)) &&
      (!color || p.colors.some((c) => c.name === color)) &&
      (!inStock || p.in_stock) &&
      (!onSale || p.on_promo),
  );
  const allSizes = [...new Set(products.flatMap((p) => p.sizes))];
  const allColors = [...new Map(products.flatMap((p) => p.colors).map((c) => [c.name, c])).values()];
  const filtered = matches.filter((p) => !cats.length || cats.includes(p.category));
  const sorted = [...filtered].sort((a, b) =>
    sort === "low"
      ? a.effective_price - b.effective_price
      : sort === "high"
        ? b.effective_price - a.effective_price
        : sort === "name"
          ? a.name.localeCompare(b.name)
          : 0,
  );
  const pages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const current = Math.min(page, pages);
  const shown = sorted.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const single = cats.length === 1 ? categories.find((c) => c.slug === cats[0]) : null;
  const title = query ? `Results for "${query}"` : single?.name ?? "All products";
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

  const filters = (
    <div className="space-y-7 text-sm">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Filters</span>
        <button type="button" onClick={clear} className="text-xs text-muted-foreground hover:text-foreground">Clear all</button>
      </div>
      {categories.length > 0 && (
        <fieldset className="border-b border-border pb-6">
          <legend className="mb-3 font-serif font-semibold">Category</legend>
          <div className="space-y-2.5">
            {categories.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-2.5">
                <Checkbox
                  checked={cats.includes(c.slug)}
                  onCheckedChange={(on) =>
                    changed(() => setCats(on ? [...cats, c.slug] : cats.filter((x) => x !== c.slug)))
                  }
                />
                <span className="flex-1">{c.name}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{matches.filter((p) => p.category === c.slug).length}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {allSizes.length > 0 && (
        <div className="border-b border-border pb-6">
          <p className="mb-3 font-serif font-semibold">Size</p>
          <div className="flex flex-wrap gap-1.5">
            {allSizes.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={size === s}
                onClick={() => changed(() => setSize(size === s ? null : s))}
                className={cn("h-9 min-w-9 border px-2 text-xs", size === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground")}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {allColors.length > 0 && (
        <div className="border-b border-border pb-6">
          <p className="mb-3 font-serif font-semibold">Colour</p>
          <div className="flex flex-wrap gap-2">
            {allColors.map((c) => (
              <button
                key={c.name}
                type="button"
                title={c.name}
                aria-label={c.name}
                aria-pressed={color === c.name}
                onClick={() => changed(() => setColor(color === c.name ? null : c.name))}
                className={cn("h-7 w-7 rounded-full border border-border ring-offset-2 ring-offset-background", color === c.name && "ring-2 ring-foreground")}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      )}
      {maxPrice > 0 && (
        <div className="border-b border-border pb-6">
          <p className="mb-4 font-serif font-semibold">Price</p>
          <Slider
            min={0}
            max={maxPrice}
            step={1}
            value={[lo, hi]}
            onValueChange={(v) => changed(() => setRange([v[0], v[1]]))}
            aria-label="Price range"
          />
          <div className="mt-3 flex justify-between text-xs tabular-nums text-muted-foreground">
            <span>{formatGHS(lo)}</span>
            <span>{formatGHS(hi)}</span>
          </div>
        </div>
      )}
      <fieldset>
        <legend className="mb-3 font-serif font-semibold">Availability</legend>
        <div className="space-y-2.5">
          <label className="flex cursor-pointer items-center gap-2.5">
            <Checkbox checked={inStock} onCheckedChange={(on) => changed(() => setInStock(!!on))} /> In stock
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <Checkbox checked={onSale} onCheckedChange={(on) => changed(() => setOnSale(!!on))} /> On sale
          </label>
        </div>
      </fieldset>
    </div>
  );

  return (
    <Layout>
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs items={[{ label: "Shop", to: "/shop" }, { label: title }]} />
          <h1 className="mt-5 font-serif text-4xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}, ready to order.
          </p>
        </div>
      </section>

      <section className="container mx-auto grid gap-10 px-4 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>
        <div>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-none lg:hidden">
                    <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="overflow-y-auto">
                  <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                  <div className="mt-6">{filters}</div>
                </SheetContent>
              </Sheet>
              <p className="hidden text-sm text-muted-foreground sm:block">
                Showing {sorted.length ? (current - 1) * PER_PAGE + 1 : 0}–{Math.min(current * PER_PAGE, sorted.length)} of {sorted.length}
              </p>
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="h-9 w-44 rounded-none" aria-label="Sort products"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Sort: Newest first</SelectItem>
                <SelectItem value="low">Price: Low to high</SelectItem>
                <SelectItem value="high">Price: High to low</SelectItem>
                <SelectItem value="name">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[4/5]" />)}
            </div>
          ) : shown.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-serif text-xl">Nothing matches those filters</p>
              <Button variant="outline" className="mt-4 rounded-none" onClick={clear}>Clear filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-4">
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
                  className={cn("h-10 w-10", n === current ? "bg-primary text-primary-foreground" : "hover:bg-accent")}
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
