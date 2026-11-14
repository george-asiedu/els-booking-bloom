import { BigSavingZone, CategoriesFor, InTheLimelight, NewArrivals, TopBrands } from "@/components/shop/HomeSections";
import { HeroSlides } from "@/components/HeroSlides";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { SHOP_CTA } from "@/components/shop/ProductCard";
import { useStudio } from "@/hooks/useStudio";
import { productCategoriesApi, productsApi } from "@/lib/api";
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
  const { config, features, isLoading } = useStudio();
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
  useHideSplashWhen(!isLoading && !loadingProducts);

  const withPhotos = products.filter((p) => p.image_url);
  const heroImg = content?.heroImageUrl ?? withPhotos[0]?.image_url ?? heroFallback;
  const newArrivals = [...products].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")).slice(0, 10);

  return (
    <ShopLayout>
      {/* Hero */}
      <section className="relative isolate flex min-h-[calc(100svh-22rem)] items-center overflow-hidden md:min-h-[calc(100svh-20rem)]">
        <HeroSlides images={[heroImg, ...withPhotos.map((p) => p.image_url!)]} className="absolute inset-0 -z-20" imgClassName="object-[50%_20%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
        <div className="container mx-auto px-4 py-10 text-white md:px-12 md:py-12">
          <p className="hero-rise text-xs tracking-wider text-white/80 [animation-delay:80ms]">{content?.heroEyebrow || t.eyebrow}</p>
          <h1 className={cn("hero-rise mt-4 max-w-xl text-balance text-5xl leading-[1.05] [animation-delay:180ms] md:text-5xl lg:text-6xl [@media(min-width:1280px)_and_(min-height:820px)]:text-7xl", heading)}>
            {content?.heroHeadline || t.headline}
          </h1>
          <p className="hero-rise mt-5 max-w-md text-white/85 [animation-delay:280ms]">{content?.heroSubtext || t.subtext}</p>
          <div className="hero-rise mt-8 flex flex-wrap items-center gap-6 [animation-delay:380ms]">
            <Link to="/shop/products" className={SHOP_CTA}>{t.cta}</Link>
            <a href="#limelight" className="text-sm hover:underline">{t.bestTitle} →</a>
          </div>
        </div>
      </section>

      <NewArrivals products={newArrivals} />
      <BigSavingZone products={products} categories={categories} />
      <CategoriesFor audience="MEN" products={products} categories={categories} />
      <CategoriesFor audience="WOMEN" products={products} categories={categories} />
      <TopBrands products={products} />
      <InTheLimelight products={products} />

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
