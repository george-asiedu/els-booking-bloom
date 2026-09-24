import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, ShoppingCart, Loader2, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { StudioPageHero } from "@/components/storefront/StudioPageHero";
import { Reveal } from "@/components/Reveal";
import { ToastAction } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  productsApi,
  productCategoriesApi,
  commerceApi,
  cartApi,
  galleryApi,
  ProductDTO,
} from "@/lib/api";
import { ApiError } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { setPendingCartAdd, takePendingCartAdd } from "@/lib/pendingCart";
import { cn } from "@/lib/utils";

const GHS = (n: number) => `GH₵ ${n.toLocaleString()}`;
const titleize = (slug: string) =>
  slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

const Shop = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState("all");

  const { data: commerce } = useQuery({
    queryKey: ["commerce-settings"],
    queryFn: () => commerceApi.getSettings(),
  });
  const productsQuery = useInfiniteQuery({
    queryKey: ["public-products", "cursor-pages"],
    queryFn: ({ pageParam }) => productsApi.listActivePage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
  const products = productsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const isLoading = productsQuery.isLoading;
  const { data: categories = [] } = useQuery({
    queryKey: ["public-product-categories"],
    queryFn: () => productCategoriesApi.listActive(),
  });
  const { data: gallery = [] } = useQuery({
    queryKey: ["public-gallery"],
    queryFn: () => galleryApi.listActive(),
  });

  const viewCartAction = (
    <ToastAction altText="View cart" onClick={() => navigate("/cart")}>
      View cart
    </ToastAction>
  );

  // Resume an add-to-cart a guest attempted before being sent to log in.
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      const pid = takePendingCartAdd();
      if (pid) {
        cartApi
          .addItem(pid, 1)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            toast({
              title: "Added to cart",
              description: "Picked up where you left off.",
              action: viewCartAction,
            });
          })
          .catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const addMutation = useMutation({
    mutationFn: (productId: string) => cartApi.addItem(productId, 1),
    onMutate: (productId) => setAddingId(productId),
    onSuccess: (_d, productId) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      const p = products.find((x) => x.id === productId);
      toast({
        title: "Added to cart",
        description: p ? `${p.name} added to your bag.` : "Item added to your cart.",
        action: viewCartAction,
      });
    },
    onError: (error, productId) => {
      if (error instanceof ApiError && error.status === 401) {
        setPendingCartAdd(productId);
        return;
      }
      toast({
        variant: "destructive",
        title: "Couldn't add to cart",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
    onSettled: () => setAddingId(null),
  });

  const handleAdd = (product: ProductDTO) => {
    if (!user) {
      setPendingCartAdd(product.id);
      navigate("/login?redirect=/shop");
      return;
    }
    if (user.role === "ADMIN") {
      toast({
        variant: "destructive",
        title: "Admins can't shop",
        description: "Use a customer account to make purchases.",
      });
      return;
    }
    addMutation.mutate(product.id);
  };

  const nameBySlug = new Map(categories.map((c) => [c.slug, c.name]));
  const catName = (slug: string) => nameBySlug.get(slug) ?? titleize(slug);
  const present = Array.from(new Set(products.map((p) => p.category)));
  const orderedSlugs = categories.map((c) => c.slug);
  const tabSlugs = [
    ...orderedSlugs.filter((s) => present.includes(s)),
    ...present.filter((s) => !orderedSlugs.includes(s)),
  ];
  const filtered =
    activeCat === "all" ? products : products.filter((p) => p.category === activeCat);

  // Shop turned off by the admin.
  if (commerce && !commerce.enabled) {
    return (
      <Layout>
        <section className="py-24">
          <div className="container mx-auto max-w-md px-4 text-center">
            <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">
              The shop is currently closed
            </h1>
            <p className="mb-6 text-muted-foreground">Please check back soon.</p>
            <Button asChild>
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  const heroImg =
    products.find((p) => p.image_url)?.image_url ?? gallery[0]?.image_url ?? null;

  return (
    <Layout>
      <StudioPageHero
        eyebrow="The studio shop"
        title={
          <>
            Beauty essentials,
            <br />
            <span className="text-primary">chosen for you.</span>
          </>
        }
        description="Curated products to prep, style and maintain your look between appointments."
        image={heroImg}
        variant="commerce"
      />

      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-2xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="mx-auto max-w-md py-16 text-center">
              <ShoppingBag className="mx-auto mb-4 h-10 w-10 text-primary/40" />
              <h2 className="font-serif text-2xl font-bold">
                Something beautiful is coming.
              </h2>
              <p className="mt-2 text-muted-foreground">
                This studio hasn't added products yet. Check back soon.
              </p>
              <Button className="mt-6" asChild>
                <Link to="/services">Explore services</Link>
              </Button>
            </div>
          ) : (
            <>
              {tabSlugs.length > 1 && (
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
                      {slug === "all" ? "All products" : catName(slug)}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
                {filtered.map((product, i) => (
                  <Reveal key={product.id} delay={(i % 4) * 60}>
                    <div className="group flex h-full flex-col">
                      <Link
                        to={`/shop/${product.id}`}
                        className="relative block aspect-square overflow-hidden rounded-2xl bg-secondary"
                      >
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center">
                            <ImageOff className="h-10 w-10 text-muted-foreground" />
                          </span>
                        )}
                        <span className="absolute left-2 top-2 flex gap-1">
                          {product.popular && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                              Popular
                            </span>
                          )}
                          {product.on_promo && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                              style={{ backgroundColor: "hsl(var(--toast-success))" }}
                            >
                              Sale
                            </span>
                          )}
                        </span>
                        {!product.in_stock && (
                          <span className="absolute inset-0 flex items-center justify-center bg-background/60">
                            <span className="rounded-full bg-card px-3 py-1 text-xs font-medium">
                              Out of stock
                            </span>
                          </span>
                        )}
                      </Link>

                      <div className="flex flex-1 flex-col pt-3">
                        <Link to={`/shop/${product.id}`} className="min-w-0">
                          <h3 className="line-clamp-1 font-medium transition-colors group-hover:text-primary">
                            {product.name}
                          </h3>
                        </Link>
                        <div className="mt-1 flex items-baseline gap-2">
                          {product.on_promo ? (
                            <>
                              <span className="text-xs text-muted-foreground line-through">
                                {GHS(product.price)}
                              </span>
                              <span className="font-semibold text-primary">
                                {GHS(product.effective_price)}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-primary">
                              {GHS(product.price)}
                            </span>
                          )}
                          {product.in_stock && (
                            <span
                              className={cn(
                                "ml-auto text-xs",
                                product.track_stock && product.stock <= 5
                                  ? "text-amber-600"
                                  : "text-muted-foreground",
                              )}
                            >
                              {product.track_stock
                                ? `${product.stock} left`
                                : "In stock"}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          className="mt-3 w-full"
                          disabled={!product.in_stock || addingId === product.id}
                          onClick={() => handleAdd(product)}
                        >
                          {addingId === product.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ShoppingCart className="mr-2 h-4 w-4" />
                          )}
                          {product.in_stock ? "Add to cart" : "Out of stock"}
                        </Button>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
              {productsQuery.hasNextPage && (
                <div className="mt-10 text-center">
                  <Button variant="outline" onClick={() => productsQuery.fetchNextPage()} disabled={productsQuery.isFetchingNextPage}>
                    {productsQuery.isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Load more products
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Shop;
