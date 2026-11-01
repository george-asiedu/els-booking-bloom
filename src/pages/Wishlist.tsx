import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { ShopLayout as Layout } from "@/components/shop/ShopLayout";
import { Breadcrumbs, ProductCard, SHOP_CTA } from "@/components/shop/ProductCard";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { productsApi } from "@/lib/api";

/** Products the customer saved with the heart. */
const Wishlist = () => {
  const { user } = useAuth();
  const { ids } = useWishlist();
  const { data: products = [] } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => productsApi.listActive(),
  });
  if (!user) return <Navigate to="/login?redirect=/wishlist" replace />;
  const saved = ids.flatMap((id) => products.filter((p) => p.id === id));
  return (
    <Layout>
      <section className="container mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: "Shop", to: "/shop" }, { label: "Wishlist" }]} />
        <h1 className="mt-5 font-serif text-4xl">Your wishlist</h1>
        {saved.length === 0 ? (
          <div className="py-20 text-center">
            <Heart className="mx-auto mb-4 h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="text-muted-foreground">Tap the heart on anything you like to save it here.</p>
            <Link to="/shop/products" className={`${SHOP_CTA} mt-6`}>Browse products</Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-x-4">
            {saved.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Wishlist;
