import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Truck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard } from "@/components/shop/ProductCard";
import { useStudio } from "@/hooks/useStudio";
import { productCategoriesApi, productsApi, promoApi } from "@/lib/api";
import { shopTemplateFor } from "@/lib/shopTemplates";
import { useHideSplashWhen } from "@/lib/splash";
import { cn } from "@/lib/utils";
import heroFallback from "@/assets/hero-beauty.jpg";

const BADGE_ICONS = [Wallet, Truck, BadgeCheck];

/**
 * The shop's home page (shop-website-design): hero, category shortcuts, new
 * arrivals, an offer banner, best sellers, and a join-and-earn invitation.
 * The wording follows what the shop sells (lib/shopTemplates).
 */
const ShopHome = () => {
  const { name, config, features, isLoading } = useStudio();
  const t = shopTemplateFor(config?.shopCategory);
  const content = config?.content;
  const serif = t.headingStyle === "serif" ? "font-serif" : "font-bold tracking-tight";

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
  const newArrivals = products.slice(0, 5);
  const popular = products.filter((p) => p.popular);
  const bestSellers = (popular.length ? popular : products).slice(0, 8);
  const banner = promos[0];
  const bannerImg = withPhotos[1]?.image_url ?? withPhotos[0]?.image_url ?? heroImg;
  const catTiles = categories.slice(0, 6).map((c) => {
    const items = products.filter((p) => p.category === c.slug);
    return { ...c, count: items.length, img: items.find((p) => p.image_url)?.image_url ?? null };
  });

  return (
    <ShopLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-secondary">
        <div className="container mx-auto grid items-center gap-8 px-4 py-10 md:grid-cols-2 md:py-16 lg:py-20">
          <div className="order-2 md:order-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{content?.heroEyebrow || t.eyebrow}</p>
            <h1 className={cn("mt-4 text-balance text-4xl leading-[1.05] sm:text-5xl lg:text-6xl", serif)}>
              {content?.heroHeadline || t.headline}
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground md:text-lg">{content?.heroSubtext || t.subtext}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="rounded-none px-8" asChild>
                <Link to="/shop/products">{t.cta}</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <a href="#best">
                  {t.bestTitle} <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </a>
              </Button>
            </div>
          </div>
          <img
            src={heroImg}
            alt=""
            className="order-1 aspect-[4/3] w-full object-cover md:order-2 md:aspect-[4/5] lg:aspect-[5/6]"
          />
        </div>
      </section>

      {/* Categories */}
      {catTiles.length > 0 && (
        <section className="border-b border-border">
          <div className="container mx-auto flex snap-x gap-6 overflow-x-auto px-4 py-8 [scrollbar-width:none] md:justify-center md:gap-10">
            {catTiles.map((c) => (
              <Link key={c.id} to={`/shop/products?category=${c.slug}`} className="group flex shrink-0 snap-start flex-col items-center text-center">
                <span className="h-20 w-20 overflow-hidden rounded-full bg-muted ring-1 ring-border md:h-24 md:w-24">
                  {c.img && <img src={c.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />}
                </span>
                <span className="mt-2 text-sm font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.count} {c.count === 1 ? "item" : "items"}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New arrivals: one large, the rest around it */}
      {newArrivals.length > 0 && (
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">New arrivals</p>
              <h2 className={cn("mt-1 text-3xl md:text-4xl", serif)}>{t.newTitle}</h2>
            </div>
            <Link to="/shop/products" className="shrink-0 text-sm font-medium hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {newArrivals.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                badge="New"
                large={i === 0}
                className={i === 0 ? "col-span-2 row-span-2" : undefined}
              />
            ))}
          </div>
        </section>
      )}

      {/* Offer banner */}
      <section className="container mx-auto px-4">
        <div className="grid overflow-hidden bg-foreground text-background md:grid-cols-2">
          <div className="flex flex-col justify-center gap-4 p-8 md:p-12">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-background/70">{banner ? "Special offer" : "From our collection"}</p>
            <p className={cn("text-balance text-3xl leading-tight md:text-4xl", serif)}>
              {banner?.message ?? `Something new at ${name}`}
            </p>
            <Button className="w-fit rounded-none px-8" asChild>
              <Link to="/shop/products">Shop now</Link>
            </Button>
          </div>
          <img src={bannerImg} alt="" loading="lazy" className="aspect-[4/3] h-full w-full object-cover md:aspect-auto" />
        </div>
      </section>

      {/* Best sellers */}
      {bestSellers.length > 0 && (
        <section id="best" className="container mx-auto scroll-mt-24 px-4 py-12 md:py-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className={cn("text-3xl md:text-4xl", serif)}>{t.bestTitle}</h2>
            <Link to="/shop/products" className="shrink-0 text-sm font-medium hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-4">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {products.length === 0 && !loadingProducts && (
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className={cn("text-2xl", serif)}>New products are on the way</h2>
          <p className="mt-2 text-muted-foreground">Check back soon to see what's in store.</p>
        </section>
      )}

      {/* Trust badges */}
      <section className="border-y border-border">
        <div className="container mx-auto grid gap-6 px-4 py-8 sm:grid-cols-3">
          {t.badges.map((b, i) => {
            const Icon = BADGE_ICONS[i];
            return (
              <p key={b} className="flex items-center justify-center gap-3 text-sm font-medium">
                <Icon className="h-5 w-5 text-primary" aria-hidden /> {b}
              </p>
            );
          })}
        </div>
      </section>

      {/* Join */}
      {features.loyalty && (
        <section className="container mx-auto px-4 py-16 text-center">
          <h2 className={cn("text-3xl", serif)}>{t.joinTitle}</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">{t.joinText}</p>
          <Button className="mt-6 rounded-none px-8" asChild>
            <Link to="/signup">Create an account</Link>
          </Button>
        </section>
      )}
    </ShopLayout>
  );
};

export default ShopHome;
