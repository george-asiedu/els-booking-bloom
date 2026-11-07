import { HeroSlides } from "@/components/HeroSlides";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard, SHOP_CTA } from "@/components/shop/ProductCard";
import { useStudio } from "@/hooks/useStudio";
import { productCategoriesApi, productsApi, promoApi } from "@/lib/api";
import { shopTemplateFor } from "@/lib/shopTemplates";
import { useHideSplashWhen } from "@/lib/splash";
import { cn } from "@/lib/utils";
import heroFallback from "@/assets/hero-beauty.jpg";

/**
 * The shop's home page (shop-website-design): full-width photo hero, category
 * circles, an editorial new-arrivals grid, a full-width offer banner, best
 * sellers and a join invitation. Wording follows what's sold (lib/shopTemplates).
 */
const ShopHome = () => {
  const { name, config, features, isLoading } = useStudio();
  const t = shopTemplateFor(config?.shopCategory);
  const content = config?.content;
  const heading = t.headingStyle === "serif" ? "font-serif" : "font-semibold tracking-tight";

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => productsApi.listActive(),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["public-product-categories"],
    queryFn: () => productCategoriesApi.listActive(),
  });
  const { data: promos = [] } = useQuery({
    queryKey: ["promo-banners", "shop"],
    queryFn: () => promoApi.listActive("shop"),
    staleTime: 5 * 60 * 1000,
  });
  useHideSplashWhen(!isLoading && !loadingProducts);

  const withPhotos = products.filter((p) => p.image_url);
  const heroImg = content?.heroImageUrl ?? withPhotos[0]?.image_url ?? heroFallback;
  const newArrivals = products.slice(0, 8);
  const popular = products.filter((p) => p.popular);
  const bestSellers = (popular.length >= 4 ? popular : products).slice(0, 8);
  const banner = promos[0];
  const bannerImg = content?.ctaImageUrl ?? withPhotos[1]?.image_url ?? heroImg;
  const catTiles = categories.slice(0, 6).map((c) => {
    const items = products.filter((p) => p.category === c.slug);
    return { ...c, count: items.length, img: items.find((p) => p.image_url)?.image_url ?? null };
  });
  const [big, tall, stackA, stackB, ...rest] = newArrivals;

  return (
    <ShopLayout>
      {/* Hero */}
      <section className="relative isolate flex min-h-[70svh] items-center overflow-hidden md:min-h-[640px]">
        <HeroSlides images={[heroImg, ...withPhotos.map((p) => p.image_url!)]} className="absolute inset-0 -z-20" imgClassName="object-[50%_20%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
        <div className="container mx-auto px-4 py-16 text-white md:px-12">
          <p className="hero-rise text-xs tracking-wider text-white/80 [animation-delay:80ms]">{content?.heroEyebrow || t.eyebrow}</p>
          <h1 className={cn("hero-rise mt-4 max-w-xl text-balance text-5xl leading-[1.05] [animation-delay:180ms] md:text-7xl", heading)}>
            {content?.heroHeadline || t.headline}
          </h1>
          <p className="hero-rise mt-5 max-w-md text-white/85 [animation-delay:280ms]">{content?.heroSubtext || t.subtext}</p>
          <div className="hero-rise mt-8 flex flex-wrap items-center gap-6 [animation-delay:380ms]">
            <Link to="/shop/products" className={SHOP_CTA}>{t.cta}</Link>
            <a href="#best" className="text-sm hover:underline">{t.bestTitle} →</a>
          </div>
        </div>
      </section>

      {/* Categories */}
      {catTiles.length > 0 && (
        <section className="bg-secondary/60">
          <div className="container mx-auto flex snap-x justify-between overflow-x-auto px-4 py-10 [scrollbar-width:none] md:py-12">
            {catTiles.map((c, i) => (
              <Link
                key={c.id}
                to={`/shop/products?category=${c.slug}`}
                className={cn(
                  "group flex min-w-[8rem] flex-1 shrink-0 snap-start flex-col items-center px-3 text-center",
                  i > 0 && "border-l border-border",
                )}
              >
                <span className="h-20 w-20 overflow-hidden rounded-full bg-muted md:h-24 md:w-24">
                  {c.img && <img src={c.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                </span>
                <span className="mt-3 text-sm font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.count} {c.count === 1 ? "item" : "items"}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New arrivals: wide tile, tall tile, two stacked, then a row */}
      {big && (
        <section className="bg-secondary/60 pb-14 md:pb-20">
          <div className="container mx-auto px-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">New arrivals</p>
            <div className="mb-6 mt-1 flex items-end justify-between gap-4">
              <h2 className={cn("text-3xl md:text-4xl", heading)}>{t.newTitle}</h2>
              <Link to="/shop/products" className="shrink-0 text-sm hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-12 md:gap-4">
              <ProductCard product={big} badge="New" tall className="col-span-2 md:col-span-5 md:row-span-2 md:min-h-[34rem]" />
              {tall && <ProductCard product={tall} tall className="md:col-span-4 md:row-span-2" />}
              {stackA && <ProductCard product={stackA} tall className="md:col-span-3" />}
              {stackB && <ProductCard product={stackB} tall className="col-span-2 md:col-span-3" />}
            </div>
            {rest.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3 md:mt-4 md:grid-cols-4 md:gap-4">
                {rest.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Offer banner */}
      <section className="relative isolate overflow-hidden">
        <img src={bannerImg} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="container mx-auto px-4 py-20 text-white md:px-12 md:py-28">
          <p className="text-xs tracking-wider text-white/80">{banner ? "Special offer" : "From our collection"}</p>
          <p className={cn("mt-3 max-w-lg text-balance text-3xl leading-tight md:text-4xl", heading)}>
            {banner?.message ?? `Something new at ${name}`}
          </p>
          <Link to="/shop/products" className={cn(SHOP_CTA, "mt-6 h-11")}>Shop now</Link>
        </div>
      </section>

      {/* Best sellers */}
      {bestSellers.length > 0 && (
        <section id="best" className="scroll-mt-24 bg-secondary/60 py-14 md:py-20">
          <div className="container mx-auto px-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Most loved</p>
            <h2 className={cn("mb-6 mt-1 text-3xl md:text-4xl", heading)}>{t.bestTitle}</h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-4 md:gap-x-4">
              {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {products.length === 0 && !loadingProducts && (
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className={cn("text-2xl", heading)}>New products are on the way</h2>
          <p className="mt-2 text-muted-foreground">Check back soon to see what's in store.</p>
        </section>
      )}

      {/* Join */}
      {features.loyalty && (
        <section className="overflow-hidden py-16 text-center md:pt-20">
          <div className="container mx-auto px-4">
            <h2 className={cn("text-3xl", heading)}>{t.joinTitle}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">{t.joinText}</p>
            <Link to="/signup" className="mt-6 inline-flex h-10 items-center rounded-full bg-primary px-6 text-sm text-primary-foreground hover:opacity-85">
              Become a customer →
            </Link>
          </div>
        </section>
      )}
    </ShopLayout>
  );
};

export default ShopHome;
