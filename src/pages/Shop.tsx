import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, ShoppingCart, Loader2, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  productsApi,
  productCategoriesApi,
  commerceApi,
  cartApi,
  ProductDTO,
} from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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

  const addMutation = useMutation({
    mutationFn: (productId: string) => cartApi.addItem(productId, 1),
    onMutate: (productId) => setAddingId(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Added to cart", description: "Item added to your cart." });
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Couldn't add to cart",
        description: error instanceof Error ? error.message : "Please try again.",
      }),
    onSettled: () => setAddingId(null),
  });

  const handleAdd = (product: ProductDTO) => {
    if (!user) {
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

  // Shop turned off by the admin.
  if (commerce && !commerce.enabled) {
    return (
      <Layout>
        <section className="py-24">
          <div className="container mx-auto px-4 text-center max-w-md">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
              The shop is currently closed
            </h1>
            <p className="text-muted-foreground mb-6">
              Please check back soon.
            </p>
            <Button asChild>
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Shop Products
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Take the salon home — curated products to prep, style and maintain
            your look between appointments.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-80 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No products available yet. Check back soon!
              </p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="flex flex-wrap justify-center gap-2 mb-10 h-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                {tabSlugs.map((slug) => (
                  <TabsTrigger key={slug} value={slug}>
                    {catName(slug)}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all">
                <ProductGrid
                  products={products}
                  onAdd={handleAdd}
                  addingId={addingId}
                />
              </TabsContent>
              {tabSlugs.map((slug) => (
                <TabsContent key={slug} value={slug}>
                  <ProductGrid
                    products={products.filter((p) => p.category === slug)}
                    onAdd={handleAdd}
                    addingId={addingId}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </section>
    </Layout>
  );
};

interface GridProps {
  products: ProductDTO[];
  onAdd: (p: ProductDTO) => void;
  addingId: string | null;
}

const ProductGrid = ({ products, onAdd, addingId }: GridProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {products.map((product, index) => (
      <div
        key={product.id}
        className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow animate-fade-in flex flex-col"
        style={{ animationDelay: `${index * 40}ms` }}
      >
        <div className="relative aspect-square bg-secondary flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageOff className="h-10 w-10 text-muted-foreground" />
          )}
          <div className="absolute top-2 left-2 flex gap-1">
            {product.popular && <Badge>Popular</Badge>}
            {product.on_promo && (
              <Badge className="bg-green-600 hover:bg-green-600">Promo</Badge>
            )}
          </div>
          {!product.in_stock && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Badge variant="secondary">Out of stock</Badge>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-foreground">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between">
            {product.on_promo ? (
              <span className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground line-through">
                  GHS {product.price}
                </span>
                <span className="text-lg font-bold text-primary">
                  GHS {product.effective_price}
                </span>
              </span>
            ) : (
              <span className="text-lg font-bold text-primary">
                GHS {product.price}
              </span>
            )}
            {product.track_stock && product.in_stock && product.stock <= 5 && (
              <span className="text-xs text-amber-600">
                {product.stock} left
              </span>
            )}
          </div>

          <Button
            className="mt-4 w-full"
            disabled={!product.in_stock || addingId === product.id}
            onClick={() => onAdd(product)}
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
    ))}
  </div>
);

export default Shop;
